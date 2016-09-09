define([
        'angular',
        'lodash',
        'app/plugins/sdk'
    ],
    function (angular, _, sdk) {
        'use strict';


        var AtsdQueryCtrl = (function (_super) {

            function AtsdQueryCtrl($scope, $injector) {
                var self = this;
                _super.call(this, $scope, $injector);

                this.suggest = {
                    metrics: [],
                    entities: [],
                    aggregation: {
                        types: aggregateOptions(),
                        period: {
                            units: unitOptions()
                        }
                    },
                    tags: {
                        keys: [],
                        values: []
                    }
                };

                this.segments = {};
                this.segments.tagEditor = {
                    key: undefined,
                    value: undefined
                };

                this.state = {
                    isLoaded: true,
                    tagRow: {
                        isEdit: false,
                        canAdd: true,
                        tags: []
                    }
                };

                this.scope = $scope;

                if (this.target.entity) {
                    this.entityBlur();
                }

                if (typeof this.target.tags !== 'object') {
                    this.target.tags = [];
                } else {
                    for (var tag in this.target.tags) {
                        this.state.tagRow.tags.push({selected: false});
                    }
                }
                this.target.entity = (this.target.entity) ? this.target.entity : undefined;
                this.target.metric = (this.target.metric) ? this.target.metric : undefined;
                this.target.aggregation = (this.target.aggregation) ? this.target.aggregation : {
                    type: this.suggest.aggregation.types[0].value,
                    period: {
                        count: 1,
                        unit: this.suggest.aggregation.period.units[3].value
                    }
                };


                this.datasource.getEntities({expression: 'name LIKE \'*\'',}).then(function (result) {
                    result.forEach(function (item) {
                        self.suggest.entities.push(item.name);
                    });
                    self.state.isLoaded = false;
                });
            }


            AtsdQueryCtrl.prototype = Object.create(_super.prototype);
            AtsdQueryCtrl.prototype.constructor = AtsdQueryCtrl;

            AtsdQueryCtrl.prototype.entityBlur = function ($event) {
                this.refresh();
                var self = this;
                this.datasource.getMetrics(this.target.entity, {}).then(function (result) {
                    self.suggest.metrics.length = 0;
                    result.forEach(function (item) {
                        self.suggest.metrics.push(item.name);
                    })
                })
            };

            AtsdQueryCtrl.prototype.metricBlur = function () {
                this.refresh();
                this.suggestTags();
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

            AtsdQueryCtrl.prototype.tagRemove = function (index) {
                this.target.tags.splice(index, 1);
                this.segments.tagEditor.editIndex = undefined;
                this.refresh();
            };

            AtsdQueryCtrl.prototype.tagEdit = function (index) {
                this.segments.tagEditor.editIndex = index;
                this.segments.tagEditor.key = this.target.tags[index].key;
                this.segments.tagEditor.value = this.target.tags[index].value;
                this.state.tagRow.tags[index].isEdit = true;
                this.state.tagRow.isEdit = true;
                this.state.tagRow.isEdit = true;

            };

            AtsdQueryCtrl.prototype.tagMouseover = function (index) {
                if (!this.state.tagRow.isEdit) {
                    this.state.tagRow.tags[index].selected = true;
                }
            };

            AtsdQueryCtrl.prototype.tagMouseleave = function (index) {
                if (!this.state.tagRow.isEdit) {
                    this.state.tagRow.tags[index].selected = false;
                }
            };

            AtsdQueryCtrl.prototype.saveTag = function () {
                var editorValue = {
                    key: this.segments.tagEditor.key,
                    value: this.segments.tagEditor.value
                };
                var index = this.segments.tagEditor.editIndex;
                if (typeof index !== 'undefined') {
                    this.target.tags[index] = editorValue
                } else {
                    this.target.tags.push(editorValue);
                    this.state.tagRow.tags.push({selected: false});
                }
                if (typeof this.segments.tagEditor.editIndex !== 'undefined') {
                    this.state.tagRow.tags[this.segments.tagEditor.editIndex].selected = false;
                }
                this.state.tagRow.isEdit = false;
                this.state.tagRow.canAdd = true;
                this.segments.tagEditor.key = "";
                this.segments.tagEditor.value = "";
                this.refresh();
            };

            AtsdQueryCtrl.prototype.removeAllTags = function () {
                this.closeTagEditor();
                this.target.tags.length = 0;
                this.refresh();
            };

            AtsdQueryCtrl.prototype.showTagEditor = function (index) {
                if (typeof index !== 'undefined') {
                    this.segments.tagEditor.key = this.target.tags[index].key;
                    this.segments.tagEditor.value = this.target.tags[index].value;
                    this.state.tagRow.tags[index].isEdit = true;
                }
                this.segments.tagEditor.editIndex = index;
                this.state.tagRow.isEdit = true;
                this.state.tagRow.canAdd = false;
                this.state.tagRow.isEdit = true;
                this.suggestTags();
            };

            AtsdQueryCtrl.prototype.closeTagEditor = function () {
                if (typeof this.segments.tagEditor.editIndex !== 'undefined') {
                    this.state.tagRow.tags[this.segments.tagEditor.editIndex].selected = false;
                }
                this.state.tagRow.isEdit = false;
                this.state.tagRow.canAdd = true;
                this.segments.tagEditor.key = "";
                this.segments.tagEditor.value = "";
            };


            AtsdQueryCtrl.prototype.suggestTags = function () {
                var self = this;
                if (this.target.metric) {
                    var params = {};
                    if (this.target.entity) {
                        params.entity = this.target.entity;
                    }
                    this.datasource.getMetricSeries(this.target.metric, params).then(function (series) {
                        self.suggest.tags.keys.length = 0;
                        self.suggest.tags.values.length = 0;
                        series.forEach(function (item) {
                            for (var key in item.tags) {
                                if (!self.suggest.tags.keys.includes(key)) {
                                    self.suggest.tags.keys.push(key);
                                }
                                var value = item.tags[key];
                                if (!self.suggest.tags.values.includes(value)) {
                                    if (self.segments.tagEditor.key) {
                                        if (key == self.segments.tagEditor.key &&
                                            item.metric == self.target.metric &&
                                            item.entity == self.target.entity
                                        ) {
                                            self.suggest.tags.values.push(value);
                                        }
                                    } else {
                                        self.suggest.tags.values.push(value);
                                    }
                                }

                            }
                        })
                    });
                }
            };

            AtsdQueryCtrl.templateUrl = 'partials/query.editor.html';

            function aggregateOptions() {
                var aggregateTypes = [
                    undefined,
                    'Count',
                    'Min',
                    'Max',
                    'Avg',
                    'Median',
                    'Sum',
                    'Percentile_999',
                    'Percentile_995',
                    'Percentile_99',
                    'Percentile_95',
                    'Percentile_90',
                    'Percentile_75',
                    'First',
                    'Last',
                    'Delta',
                    'Wavg',
                    'Wtavg',
                    'Standard_deviation'
                ];
                return _.map(aggregateTypes, function (item) {

                    return (item) ? {
                        label: item,
                        value: item.toUpperCase()
                    } : {
                        label: 'None',
                        value: item
                    };
                })
            }

            function unitOptions() {
                return [{
                    id: 2,
                    label: 'MILLISECOND',
                    value: 'MILLISECOND'
                }, {
                    id: 3,
                    label: 'SECOND',
                    value: 'SECOND'

                }, {
                    id: 4,
                    label: 'MINUTE',
                    value: 'MINUTE'
                }, {
                    id: 5,
                    label: 'HOUR',
                    value: 'HOUR'
                }, {
                    id: 6,
                    label: 'DAY',
                    value: 'DAY'
                }, {
                    id: 7,
                    label: 'WEEK',
                    value: 'WEEK'
                }, {
                    id: 7,
                    label: 'MONTH',
                    value: 'MONTH'
                }, {
                    id: 8,
                    label: 'QUARTER',
                    value: 'QUARTER'
                }, {
                    id: 9,
                    label: 'YEAR',
                    value: 'YEAR'
                }];
            }

            return AtsdQueryCtrl;
        })(sdk.QueryCtrl);


        return AtsdQueryCtrl;
    })
;
