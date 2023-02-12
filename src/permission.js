import NProgress from 'nprogress'; // progress bar
import 'nprogress/nprogress.css'; // progress bar style

import store from '@/store';
import router from '@/router';
import Layout from "./layouts/index.vue";
import {DashboardIcon} from "tdesign-icons-vue";

NProgress.configure({ showSpinner: false });

const whiteListRouters = store.getters['permission/whiteListRouters'];

router.beforeEach(async (to, from, next) => {
  NProgress.start();

  const token = store.getters['user/token'];

  if (token) {
    if (to.path === '/login') {
      setTimeout(() => {
        store.dispatch('user/logout');
        store.dispatch('permission/restore');
      });
      next();
      return;
    }

    const roles = store.getters['user/roles'];

    if (roles && roles.length > 0) {
      next();
    } else {
      try {
        await store.dispatch('user/getUserInfo');
        const routes = [
          { component: '/a/index.vue', path: '/a', name: 'A1', title: '测试1' },
          { component: '/b/index.vue', path: '/b', name: 'B2', title: '测试2' },
          { component: '/i/index.vue', path: 'https://ezassay.com/', name: 'BAIDU', type: 'Iframe', title: '百度' },
          {
            component: '/c/index.vue',
            path: '/c',
            name: 'c',
            title: '测试3',
            children: [
              { component: '/c/a/index.vue', path: '/c/a', name: 'ca', title: 'ca' },
              { component: '/c/b/index.vue', path: '/c/b', name: 'cb', title: 'cb' },
              { component: '/i/index.vue', path: 'https://ezassay.com/', name: 'BAIDU', type: 'Iframe', title: '百度2222' },
            ],
          },
        ];
        await store.dispatch('permission/initRoutes', routes);

        next({ ...to });
      } catch (error) {
        await store.commit('user/removeToken');
        next(`/login?redirect=${to.path}`);
        NProgress.done();
      }
    }
  } else {
    /* white list router */
    if (whiteListRouters.indexOf(to.path) !== -1) {
      next();
    } else {
      next(`/login?redirect=${to.path}`);
    }
    NProgress.done();
  }
});

router.afterEach(() => {
  NProgress.done();
});
