import {CONSUMER_KEY} from './api';

const POCKET_URL = 'https://getpocket.com';

function getRequestToken(): string {
  const match = window.location.search.match(/token=(.*)/);
  if (match) {
    return match[1];
  }
  return '';
}

function getAccessToken(input: string): string {
  const fields = input.split('&').map(f => f.split('='));
  const accessTokenField = fields.find(f => f[0] === 'access_token');
  if (accessTokenField) {
    return accessTokenField[1];
  }
  return '';
}

export default class PocketConfigCtrl {
  static templateUrl = 'partials/config.html';
  backendSrv: any;
  $rootScope: any;
  current: any;
  status: string;
  hasToken: boolean;

  /** @ngInject */
  constructor(backendSrv, $rootScope) {
    this.backendSrv = backendSrv;
    this.$rootScope = $rootScope;
    this.current.jsonData = this.current.jsonData || {};
    this.current.secureJsonFields = this.current.secureJsonFields || {};
    this.current.url = POCKET_URL;
    this.status = this.getStatus();
    this.hasToken = this.current.jsonData.accessToken !== undefined;

    // Land back here to acquire access token (Step 4)
    if (getRequestToken()) {
      // window.location.search = '';
      setTimeout(() => this.acquireAccessToken(), 2000);
    }
  }

  getStatus(): string {
    if (this.current.jsonData.accessToken) {
      return 'Connected';
    }
    if (getRequestToken()) {
      return 'Connecting...';
    }
    return 'Not connected';
  }

  getProxyUrl(): string {
    // Magic proxy URL (cannot easily reload frontend settings to obtain URL from backend)
    return `/api/datasources/proxy/${this.current.id}`;
  }

  /**
   * Connect to Pocket account by following procedure from
   * https://getpocket.com/developer/docs/authentication
   */
  async connect() {
    // Need to save datasource back to tell URL to backend
    this.current = await this.updateDatasource();

    // Redirect back here after connect
    const redirectUrl = window.location.href;

    // Obtain a request token (Step 2)
    const tokenRequestData = {
      consumer_key: CONSUMER_KEY,
      redirect_uri: redirectUrl,
    };

    const proxyUrl = this.getProxyUrl();
    const tokenResponse = await this.backendSrv.post(
      proxyUrl + '/v3/oauth/request',
      tokenRequestData
    );

    let token;
    const codePrefix = 'code=';
    if (typeof tokenResponse === 'string' && tokenResponse.startsWith(codePrefix)) {
      token = tokenResponse.slice(codePrefix.length);
    }

    if (!token) {
      // TODO throw error
      console.error('Could not acquire code to generate access token (see API step 2).');
      return;
    }

    // Redirect user to Pocket to continue authorization (Step 3)
    const redirectWithCode = encodeURIComponent(`${redirectUrl}?token=${token}`);
    const authPageUrl = `https://getpocket.com/auth/authorize?request_token=${token}&redirect_uri=${redirectWithCode}`;
    window.location.href = authPageUrl;

    // Continued in acquireAccessToken() after Pocket redirects
  }

  async acquireAccessToken() {
    // Convert a request token into a Pocket access token (Step 5)
    const requestToken = getRequestToken();
    if (!requestToken) {
      console.error('No request token found. Cannot acquire access token.');
      return;
    }

    const tokenAccessData = {
      consumer_key: CONSUMER_KEY,
      code: requestToken,
    };

    const proxyUrl = this.getProxyUrl();
    const accessTokenResponse = await this.backendSrv.post(
      proxyUrl + '/v3/oauth/authorize',
      tokenAccessData
    );
    const accessToken = getAccessToken(accessTokenResponse);

    if (!accessToken) {
      // TODO throw error
      console.error('Could not acquire access token (see API step 5).');
      return;
    }

    this.current.jsonData.accessToken = accessToken;
    this.current = await this.updateDatasource();
    this.status = this.getStatus();
    this.hasToken = true;
    this.$rootScope.$apply();
  }

  async updateDatasource() {
    const updated = await this.backendSrv.put(
      '/api/datasources/' + this.current.id,
      this.current
    );
    return updated.datasource;
  }
}
