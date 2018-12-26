import _ from 'lodash';

import {CONSUMER_KEY} from './api';
import {getTimeSeriesFromResponse} from './resultTransformations';

const CACHE_EXPIRATION = 1000 * 60 * 60; // 1h in millies

export default class PocketDatasource {
  type: string;
  url: string;
  accessToken?: string;
  cacheResult?: any;
  cacheDate?: number;

  /** @ngInject */
  constructor(instanceSettings, private backendSrv) {
    this.type = 'pocket';
    this.url = instanceSettings.url;
    this.accessToken = (instanceSettings.jsonData || {}).accessToken;
  }

  query(options) {
    const queryTargets = options.targets.filter(target => target.query);
    if (queryTargets.length === 0) {
      return Promise.resolve({data: []});
    }

    const queries = queryTargets.map(target => {
      const {query} = target;

      return this._pocketRequest(query, options || {}).then(response =>
        getTimeSeriesFromResponse(response.data, query)
      );
    });

    return Promise.all(queries).then((series: any) => {
      let seriesList = _.flattenDeep(series);
      return {data: seriesList};
    });
  }

  helperRequest(url: string, data?: any) {
    return this.backendSrv.post(this.url + url, data);
  }

  async testDatasource() {
    if (!this.accessToken) {
      return {
        status: 'error',
        message: 'Not connected to Pocket yet. Click "Connect"',
      };
    }

    // Check if access token works
    try {
      const res = await this.backendSrv.get(
        `${this.url}/v3/get?consumer_key=${CONSUMER_KEY}&access_token=${
          this.accessToken
        }&since=${Date.now()}&count=1`
      );
      if (res && !res.error) {
        return {
          status: 'success',
          message: 'Data source connected and article retrieval works.',
        };
      }
      return {
        status: 'error',
        message: 'Connected to Pocket, but something went wrong retrieving articles.',
      };
    } catch (err) {
      return {status: 'error', message: err.message};
    }
  }

  _pocketRequest(query: string, options?: any) {
    if (this.cacheDate && Date.now() - this.cacheDate <= CACHE_EXPIRATION) {
      return Promise.resolve(this.cacheResult);
    }

    const params = {
      consumer_key: CONSUMER_KEY,
      access_token: this.accessToken,
      detailType: options.detailType || 'simple',
      state: options.state || 'all',
    };

    const req: any = {
      method: 'GET',
      url: this.url + '/v3/get',
      params: params,
    };

    return this.backendSrv.datasourceRequest(req).then(
      result => {
        // Cache results from Pocket. Query and time selection still work on the result set.
        this.cacheResult = result;
        this.cacheDate = Date.now();
        return result;
      },
      function(err) {
        if (err.status !== 0 || err.status >= 300) {
          if (err.data && err.data.error) {
            throw {
              message: 'Pocket Error: ' + err.data.error,
              data: err.data,
              config: err.config,
            };
          } else {
            throw {
              message: 'Network Error: ' + err.statusText + '(' + err.status + ')',
              data: err.data,
              config: err.config,
            };
          }
        }
      }
    );
  }
}
