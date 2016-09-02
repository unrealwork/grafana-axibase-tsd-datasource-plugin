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
                self = this;
                this.loaded = true;
                this.scope = $scope;
                this.scope.suggestEntitiesList = function (name) {
                    console.log(name);
                    return self.datasource.getEntities({
                        expression: 'name LIKE \'*' + name + '*\'',
                    });
                };
                initAggregateOptions(this);
                this.target = {
                    mertic: undefined,
                    entity: undefined,
                    aggregation: this.aggregateFunctions[0].value
                };

                this.suggestEntities = [];
                this.scope.suggestEntitiesList("").then(function (result) {
                    result.forEach(function (item) {
                        self.suggestEntities.push(item.name);
                    });
                    self.loaded = false;
                });
            }

            AtsdQueryCtrl.prototype = Object.create(_super.prototype);
            AtsdQueryCtrl.prototype.constructor = AtsdQueryCtrl;

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
