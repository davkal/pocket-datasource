import {QueryCtrl} from 'grafana/app/plugins/sdk';

export default class PocketQueryCtrl extends QueryCtrl {
  static templateUrl = 'partials/query.editor.html';

  queryTypes: any[];

  /** @ngInject **/
  constructor($scope, $injector) {
    super($scope, $injector);

    this.queryTypes = [
      {text: 'Cumulative article count', value: 'cumulative_article_count'},
      {text: 'Daily adds', value: 'daily_adds'},
      {text: 'Daily reads', value: 'daily_reads'},
    ];

    if (this.target.query === undefined) {
      this.target.query = this.queryTypes[0].value;
    }
  }

  onChange = nextQuery => {
    this.target.query = nextQuery;
  };

  onExecute = () => {
    this.panelCtrl.refresh();
  };
}
