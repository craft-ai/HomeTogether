import _ from 'lodash';
import syncRequest from 'sync-request';
import { CRAFT_TOKEN, CRAFT_URL, CRAFT_OWNER } from '../constants';

export default function synchronousRequest(req) {
  req = _.defaults(req || {}, {
    method: 'GET',
    path: '',
    body: undefined,
    query: {},
    headers: {}
  });

  req.url = CRAFT_URL + '/api/v1/' + CRAFT_OWNER + req.path;
  if (_.size(req.query) > 0) {
    req.url = req.url + '?' + _.map(_.keys(req.query), key => `${key}=${req.query[key]}`).join('&');
  }
  req.headers['Authorization'] = 'Bearer ' + CRAFT_TOKEN;
  req.headers['Content-Type'] = 'application/json; charset=utf-8';
  req.headers['Accept'] = 'application/json';

  req.body = req.body && JSON.stringify(req.body);

  let res = syncRequest(req.method, req.url, req);
  return res;
}