/**
 * Browser-side OpenAPI mock — returns example responses without Prism or a VM.
 * Kept in sync with static/playground/index.html (helper is inlined there for deploy safety).
 */
(function (global) {
  function pathToRegex(openApiPath) {
    var pattern = openApiPath.replace(/\{[^}]+\}/g, '[^/]+').replace(/\//g, '\\/');
    return new RegExp('^' + pattern + '$');
  }

  function normalizePath(pathname) {
    var path = pathname || '/';
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    return path;
  }

  function requestUrl(input) {
    if (typeof input === 'string') return input;
    if (input && typeof input.url === 'string') return input.url;
    return String(input);
  }

  function requestMethod(input, init) {
    if (init && init.method) return init.method;
    if (input && typeof input.method === 'string') return input.method;
    return 'GET';
  }

  function findRoute(fixtures, method, pathname) {
    var path = normalizePath(pathname);
    var m = (method || 'get').toLowerCase();
    for (var i = 0; i < fixtures.routes.length; i++) {
      var route = fixtures.routes[i];
      if (route.method !== m) continue;
      if (route.path === path) return route;
      if (pathToRegex(route.path).test(path)) return route;
    }
    return null;
  }

  function jsonResponse(status, body) {
    if (status === 204) {
      return new Response(null, {status: 204, statusText: 'No Content'});
    }
    return new Response(JSON.stringify(body), {
      status: status,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json',
        'X-Mock-Source': 'openapi-examples',
      },
    });
  }

  function isSpecRequest(url, specUrl) {
    if (!specUrl) return false;
    try {
      var target = new URL(url, global.location.href);
      var spec = new URL(specUrl, global.location.href);
      return target.pathname === spec.pathname;
    } catch (e) {
      return String(url).indexOf('openapi.yaml') !== -1 || String(url).indexOf('openapi.json') !== -1;
    }
  }

  function isMockApiRequest(url, mockServerUrl) {
    try {
      var u = new URL(url, global.location.href);
      var mock = new URL(mockServerUrl, global.location.href);
      if (u.origin === mock.origin && u.pathname.indexOf(mock.pathname) === 0) return true;
      if (u.hostname === 'playground.mock') return true;
      if (u.hostname === 'localhost' && u.port === '4010') return true;
      if (u.hostname === '127.0.0.1' && u.port === '4010') return true;
    } catch (e) {
      /* ignore */
    }
    return false;
  }

  function apiPathFromMockUrl(requestUrlStr, mockServerUrl) {
    var u = new URL(requestUrlStr, global.location.href);
    var mock = new URL(mockServerUrl, global.location.href);
    var prefix = mock.pathname.replace(/\/$/, '');
    var path = u.pathname;
    if (path.indexOf(prefix) === 0) {
      path = path.slice(prefix.length) || '/';
    }
    return normalizePath(path);
  }

  function getMockServerUrl() {
    return new URL('mock-api', global.location.href).href.replace(/\/$/, '');
  }

  function createOpenApiMockFetch(fixtures, specUrl, mockServerUrl) {
    var nativeFetch = global.__alonixNativeFetch || global.fetch.bind(global);
    var mockBase = mockServerUrl || getMockServerUrl();

    return function customFetch(input, init) {
      var url = requestUrl(input);

      if (isSpecRequest(url, specUrl)) {
        return nativeFetch(input, init);
      }

      if (!isMockApiRequest(url, mockBase)) {
        return nativeFetch(input, init);
      }

      var method = requestMethod(input, init);
      var apiPath = apiPathFromMockUrl(url, mockBase);
      var route = findRoute(fixtures, method, apiPath);

      if (!route) {
        return Promise.resolve(
          jsonResponse(404, {
            message: 'No mock example for ' + method.toUpperCase() + ' ' + apiPath,
          })
        );
      }

      return Promise.resolve(jsonResponse(route.status, route.body));
    };
  }

  function installMockFetch(fixtures, specUrl, mockServerUrl) {
    var mockFetch = createOpenApiMockFetch(fixtures, specUrl, mockServerUrl);
    if (!global.__alonixNativeFetch) {
      global.__alonixNativeFetch = global.fetch.bind(global);
    }
    global.fetch = function (input, init) {
      return mockFetch(input, init);
    };
    return mockFetch;
  }

  global.OpenApiMockFetch = {
    getMockServerUrl: getMockServerUrl,
    createOpenApiMockFetch: createOpenApiMockFetch,
    installMockFetch: installMockFetch,
    loadFixtures: function (fixturesUrl) {
      var nativeFetch = global.__alonixNativeFetch || global.fetch.bind(global);
      return nativeFetch(fixturesUrl).then(function (res) {
        if (!res.ok) throw new Error('Failed to load mock fixtures (' + res.status + ')');
        return res.json();
      });
    },
  };
})(window);
