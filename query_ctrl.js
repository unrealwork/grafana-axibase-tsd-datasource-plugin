define([
        'angular',
        'lodash',
        'app/plugins/sdk'
    ],
    function (angular, _, sdk) {
        'use strict';

        var AtsdQueryCtrl = (function (_super) {
            var self;

            function suggestEntitiesList() {
                return self.datasource.getEntities({
                    expression: 'name LIKE \'*\'',
                });
            }

            function AtsdQueryCtrl($scope, $injector) {
                _super.call(this, $scope, $injector);
                console.log(this.target);
                self = this;

                this.suggest = {
                    metrics: [],
                    entities: [],
                    aggregations: aggregateOptions()
                };

                this.target.metric = undefined;
                this.target.entity = undefined;
                this.target.aggregation = this.suggest.aggregations[0]


                this.state = {
                    isLoaded: true
                };

                this.scope = $scope;


                suggestEntitiesList().then(function (result) {
                    result.forEach(function (item) {
                        self.suggest.entities.push(item.name);
                    });
                    self.state.isLoaded = false;
                });
            }


            AtsdQueryCtrl.prototype = Object.create(_super.prototype);
            AtsdQueryCtrl.prototype.constructor = AtsdQueryCtrl;

            AtsdQueryCtrl.prototype.entityBlur = function ($event) {
                self.panelCtrl.refresh();
                console.log($event);
                this.datasource.getMetrics(this.target.entity, {}).then(function (result) {
                    console.log(result);
                    self.suggest.metrics.length = 0;
                    result.forEach(function (item) {
                        self.suggest.metrics.push(item.name);
                    })
                })
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
            function aggregateOptions() {
                return [{
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
