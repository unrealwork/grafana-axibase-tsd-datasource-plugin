define([
        'angular',
        'lodash',
        'app/core/utils/datemath'
    ],
    function (angular, _, dateMath) {
        'use strict';
        var self;

        function AtsdDatasource(instanceSettings, $q, backendSrv, templateSrv) {
            this.type = 'atsd';
            this.url = instanceSettings.url;
            this.basicAuth = instanceSettings.basicAuth;
            this.name = instanceSettings.name;
            this.templateSrv = templateSrv;
            this.backendSrv = backendSrv;
            this.supportMetrics = true;
            this.backendSrv = backendSrv;
            this.cache = 300000;
            this.recent = {};
            this.recentTags = {};
            this.q = $q;
            self = this;
        }

        AtsdDatasource.prototype.dropCache = function () {
            this.recent = {};
            this.recentTags = {};
        };

        AtsdDatasource.prototype.query = function (options) {
            var start = _convertToAtsdTime(options.range.from);
            var end = _convertToAtsdTime(options.range.to);
            var qs = [];

            _.each(options.targets, function (target) {
                target.disconnect = options.targets[0].disconnect;
                qs.push(_convertTargetToQuery(target));
            });

            var queries = _.compact(qs);

            if (_.isEmpty(queries)) {
                var d = self.q.defer();
                d.resolve({data: []});
                return d.promise;
            }

            var groupByTags = {};

            _.each(queries, function (query) {
                _.each(query.tags, function (val, key) {
                    groupByTags[key] = true;
                });
            });

            return this._performTimeSeriesQuery(queries, start, end).then(function (response) {
                console.log(response);
                if (response.data === undefined) {
                    return {data: []};
                }

                var disconnect = queries[0].disconnect;

                var result = _.map(response.data, function (metricData) {
                    return _transformMetricData(metricData, disconnect);
                });

                result.sort(function (a, b) {
                    var nameA = a.target.toLowerCase();
                    var nameB = b.target.toLowerCase();

                    if (nameA < nameB) {
                        return -1;
                    } else if (nameA > nameB) {
                        return 1;
                    } else {
                        return 0;
                    }
                });

                return {data: result};
            });
        };

        AtsdDatasource.prototype._performTimeSeriesQuery = function (queries, start, end) {
            var tsQueries = [];

            _.each(queries, function (query) {
                if (query.entity !== '' && query.metric !== '') {
                    if (query.implicit) {
                        if (query.tagCombos !== undefined) {
                            _.each(query.tagCombos, function (group) {
                                if (group.en) {
                                    var tags = {};

                                    _.each(group.data, function (value, key) {
                                        tags[key] = [value];
                                    });

                                    tsQueries.push(
                                        {
                                            startDate: start,
                                            endDate: end,
                                            limit: 10000,
                                            entity: query.entity,
                                            metric: query.metric,
                                            tags: tags,
                                            timeFormat: 'milliseconds',
                                            aggregate: {
                                                type: query.statistic,
                                                period: {
                                                    count: query.period.count,
                                                    unit: query.period.unit
                                                }
                                            }
                                        }
                                    );
                                }
                            });
                        }
                    } else {
                        var tags = {};

                        _.each(query.tags, function (value, key) {
                            tags[key] = [value];
                        });

                        tsQueries.push(
                            {
                                startDate: start,
                                endDate: end,
                                limit: 10000,
                                entity: query.entity,
                                metric: query.metric,
                                tags: tags,
                                timeFormat: 'milliseconds',
                                aggregate: {
                                    type: query.statistic,
                                    period: {
                                        count: query.period.count,
                                        unit: query.period.unit
                                    }
                                }
                            }
                        );
                    }
                }
            });

            if (tsQueries.length === 0) {
                var d = self.q.defer();
                d.resolve({data: undefined});
                return d.promise;
            }

            console.log('queries: ' + JSON.stringify(tsQueries));

            var options = {
                method: 'POST',
                url: fullUrl('/api/v1/series/query'),
                data: tsQueries,
                headers: {
                    Authorization: this.basicAuth
                }
            };

            return self.backendSrv.datasourceRequest(options).then(function (result) {
                return result;
            });
        };


        AtsdDatasource.prototype.getEntities = function (params) {
            var options = {
                method: 'GET',
                url: fullUrl('/api/v1/entities'),
                params: params,
                headers: {
                    Authorization: self.basicAuth
                }
            };
            return httpRequest(options).then(function (result) {
                return result.data;
            });
        };


        AtsdDatasource.prototype.getMetrics = function (entity, params) {
            var options = {
                method: 'GET',
                url: fullUrl('/api/v1/entities/' + entity + '/metrics'),
                params: params,
                headers: {
                    Authorization: self.basicAuth
                }
            };
            return httpRequest(options).then(function (result) {
                return result.data;
            });
        };

        AtsdDatasource.prototype.getMetricSeries = function (metric, params) {
            var self = this;
            var options = {
                method: 'GET',
                url: fullUrl('/api/v1/metrics/' + metric + '/series'),
                params: params,
                headers: {
                    Authorization: self.basicAuth
                }
            };
            return httpRequest(options).then(function (result) {
                return result.data;
            });
        };

        AtsdDatasource.prototype.getTags = function (entity, metric) {
            return this._queryTags(entity, metric).then(function (result) {
                var tags = [];
                _.each(result.data, function (entry) {
                    if (entry.entity === entity) {
                        tags.push(entry.tags);
                    }
                });
                return tags;
            });
        };

        AtsdDatasource.prototype.testDatasource = function () {
            var options = {
                method: 'POST',
                url: fullUrl('/api/v1/series/query'),
                data: [],
                headers: {
                    Authorization: this.basicAuth
                }
            };
            console.log(options);
            return httpRequest(options).then(function () {
                return {status: "success", message: "Data source is working", title: "Success"};
            });
        };

        function _transformMetricData(metricData, disconnect) {

            var dps;
            var ret = [];

            dps = _.map(metricData.data, function (item) {
                return [item.t, item.v];
            });

            var name = metricData.entity + ': ' + metricData.metric;

            _.each(metricData.tags, function (value, key) {
                name += ', ' + key + '=' + value;
            });
            console.log(dps);
            return {target: name, datapoints: dps};
        }

        function _parsePeriod(period) {
            return {count: period.count, unit: period.unit};
        }

        function _convertToSeconds(interval) {
            var count = interval.count;

            switch (interval.unit) {
                case 'YEAR':
                    count *= 365 * 24 * 60 * 60;
                    break;
                case 'MONTH':
                    count *= 30 * 24 * 60 * 60;
                    break;
                case 'WEEK':
                    count *= 7 * 24 * 60 * 60;
                    break;
                case 'DAY':
                    count *= 24 * 60 * 60;
                    break;
                case 'HOUR':
                    count *= 60 * 60;
                    break;
                case 'MINUTE':
                    count *= 60;
                    break;
                case 'SECOND':
                    break;
                default:
                    count = 0;
            }

            return count;
        }

        function _convertTargetToQuery(target) {
            if (!target.metric || !target.entity || target.hide) {
                return null;
            }

            var query = {
                entity: self.templateSrv.replace(target.entity),
                metric: self.templateSrv.replace(target.metric),

                statistic: target.aggregation.type !== undefined ? target.aggregation.type : 'DETAIL',
                period: (target.aggregation.period !== undefined && target.aggregation.type !== undefined) ? target.aggregation.period : {
                    count: 1,
                    unit: 'DAY'
                },

                tagCombos: angular.copy(target.tagCombos),
                implicit: angular.copy(target.implicit),
                disconnect: (target.disconnect !== undefined && target.disconnect !== '') ?
                    _convertToSeconds(_parsePeriod(target.disconnect)) :
                24 * 60 * 60
            };

            query.tags = {};
            target.tags.forEach(function (item) {
                query.tags[item.key] = item.value;
            });

            return query;
        }

        function _convertToAtsdTime(date) {
            date = date !== 'now' ? date : new Date();
            date = dateMath.parse(date);

            return date.toISOString();
        }

        function httpRequest(options) {
            if (!options.cache) {
                options.cache = true;
            }
            return self.backendSrv.datasourceRequest(options);
        }


        function fullUrl(part) {
            var fullUrl = (self.url[self.url.length - 1] != '/') ? self.url + '/' : self.url;
            if (part.length > 0 && part[0] == '/') {
                part = part.substr(1, part.length - 1)
            }
            return fullUrl + part;
        }

        return AtsdDatasource;

    })
;
