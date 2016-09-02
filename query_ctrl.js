define([
        'angular',
        'lodash',
        'app/plugins/sdk'
    ],
    function (angular, _, sdk) {
        'use strict';

        var AtsdQueryCtrl = (function (_super) {
            var self;

            function AtsdQueryCtrl($scope, $injector) {
                _super.call(this, $scope, $injector);
                this.scope = $scope;
                initAggregateOptions(this);
                this.target = {
                    mertic: undefined,
                    entity: undefined,
                    aggregation: this.aggregateFunctions[0].value
                };
                self = this;
            }

            AtsdQueryCtrl.prototype = Object.create(_super.prototype);
            AtsdQueryCtrl.prototype.constructor = AtsdQueryCtrl;

            AtsdQueryCtrl.prototype.update = function () {
                console.log(self.target.aggregation);
                console.log(this.scope.selected);
            };


            AtsdQueryCtrl.prototype.suggestEntites = function (query, callback) {
                self.scope.datasource
                    .suggestEntities(query)
                    .then(callback);
            };

            AtsdQueryCtrl.prototype.suggestMetrics = function (query, callback) {
                self.scope.datasource
                    .suggestMetrics($scope.target.entity, query)
                    .then(callback);
            };

            AtsdQueryCtrl.prototype.getOptions = function () {
                return this.datasource.metricFindQuery(this.target)
                    .then(this.uiSegmentSrv.transformToSegments(false));
                // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
            };

            AtsdQueryCtrl.prototype.toggleEditorMode = function () {
                this.target.rawQuery = !this.target.rawQuery;
            };

            AtsdQueryCtrl.onChangeInternal = function () {
                this.panelCtrl.refresh(); // Asks the panel to refresh data.
            };

            AtsdQueryCtrl.templateUrl = 'partials/query.editor.html';
            <!--Entity row-->

            /**
             * Init aggregate options collection
             * for select element
             *
             * @param scope
             */
            function initAggregateOptions(instance) {
                var statisctics = {
                    'Detail': 'detail',
                    'Count': 'count',
                    'Minimum': 'min',
                    'Maximum': 'max',
                    'Average': 'avg',
                    'Median': 'median',
                    'Sum': 'sum',
                    'Percentile 99.9%': 'percentile_999',
                    'Percentile 99.5%': 'percentile_995',
                    'Percentile 99%': 'percentile_99',
                    'Percentile 95%': 'percentile_95',
                    'Percentile 90%': 'percentile_90',
                    'Percentile 75%': 'percentile_75',
                    'First value': 'first',
                    'Last value': 'last',
                    'Delta': 'delta',
                    'Weighted average': 'wavg',
                    'Weighted time average': 'wtavg',
                    'Standard deviation': 'standard_deviation'
                };

                instance.aggregateFunctions = [{
                    id: 1,
                    label: 'Detail',
                    value: {
                        name: 'detail'
                    }
                }, {
                    id: 2,
                    label: 'Count',
                    value: {
                        name: 'count'
                    }
                }
                ];
            }

            return AtsdQueryCtrl;
        })(sdk.QueryCtrl);


        return AtsdQueryCtrl;
    })
;
