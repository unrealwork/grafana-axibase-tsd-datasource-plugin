define([
        'angular',
        'lodash',
        'app/plugins/sdk'
    ],
    function (angular, _, sdk) {
        'use strict';

        var AtsdQueryCtrl = (function (_super) {
            var self = this;

            function AtsdQueryCtrl($scope, $injector) {
                _super.call(this, $scope, $injector);

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
            return AtsdQueryCtrl;
        })(sdk.QueryCtrl);


        return AtsdQueryCtrl;
    })
;
