/* @vite-ignore */
import router from '@/router';
import {cloneDeep} from "lodash";

const state = {
  whiteListRouters: ['/login'],
  routers: [],
};

const mutations = {
  setRouters: (state, routers) => {
    state.routers = routers;
  },
};

const getters = {
  routers: (state) => state.routers,
  whiteListRouters: (state) => state.whiteListRouters,
};
export const LAYOUT = () => import('@/layouts/index.vue');
export const BLANK_LAYOUT = () => import('@/layouts/blank.vue');
export const IFRAME = () => import('@/layouts/components/FrameBlank.vue');
export const EXCEPTION_COMPONENT = () => import('@/pages/result/500/index.vue');
export const PARENT_LAYOUT = () =>
  new Promise((resolve) => {
    resolve({ name: 'ParentLayout' });
  });

export const PAGE_NOT_FOUND_ROUTE = {
  path: '/:w+',
  name: '404Page',
  redirect: '/result/404',
};

const LayoutMap = new Map()

LayoutMap.set('LAYOUT', LAYOUT);
LayoutMap.set('BLANK', BLANK_LAYOUT);
LayoutMap.set('IFRAME', IFRAME);
let dynamicViewsModules;
// 将背景对象变成路由对象
export function transformObjectToRoutes(routeList) {
  routeList.forEach(async (route) => {
    if (route.type === 'Layout') {
      route.component = LayoutMap.get('LAYOUT');
    } else if (route.type === 'Iframe') {
      // eslint-disable-next-line no-use-before-define
      route.component = asyncImportRoutes([route]);
      // route.children = [cloneDeep(route)];
      // route.meta = { title: route.title, frameSrc: route.path, frameBlank: true };
    } else {
      route.children = [cloneDeep(route)];
      // route.path = '';
      route.component = LAYOUT;
      // route.name = `${route.name}Parent`;
      route.meta = { title: route.title };
    }
    // eslint-disable-next-line no-unused-expressions,no-use-before-define
    route.children && asyncImportRoutes(route.children);
    // eslint-disable-next-line no-use-before-define
    if (route.meta.icon) route.meta.icon = await getMenuIcon(route.meta.icon);
  });

  return [...routeList] as unknown as T[];
  // return [PAGE_NOT_FOUND_ROUTE, ...routeList] as unknown as T[];
}

const iconsPath = import.meta.glob('../../../node_modules/tdesign-icons-vue-next/esm/components/*.js');
// 动态从包内引入单个Icon
async function getMenuIcon(iconName: string) {
  const RenderIcon = iconsPath[`../../../node_modules/tdesign-icons-vue-next/esm/components/${iconName}.js`];

  const Icon = await RenderIcon();
  return Icon.default;
}

export function asyncImportRoutes(routes) {
  dynamicViewsModules = dynamicViewsModules || import.meta.glob('../../pages/**/*.vue');
  if (!routes) return;

  routes.forEach(async (item) => {
    const { title, type } = item;
    const { children } = item;

    const layoutFound = LayoutMap.get('LAYOUT');
    if (type && type === 'Layout') {
      item.component = layoutFound;
      item.meta = { title };
    } else {
      item.meta = {
        title,
      };
      // eslint-disable-next-line no-use-before-define
      item.component = dynamicImports(dynamicViewsModules, item.component);
    }
    // eslint-disable-next-line no-unused-expressions
    children && asyncImportRoutes(children);
  });
}

function dynamicImports(dynamicViewsModules, component: string) {
  const keys = Object.keys(dynamicViewsModules);
  const matchKeys = keys.filter((key) => {
    const k = key.replace('../../pages', '');
    const startFlag = component.startsWith('/');
    const endFlag = component.endsWith('.vue') || component.endsWith('.tsx');
    const startIndex = startFlag ? 0 : 1;
    const lastIndex = endFlag ? k.length : k.lastIndexOf('.');
    return k.substring(startIndex, lastIndex) === component;
  });
  if (matchKeys?.length === 1) {
    const matchKey = matchKeys[0];
    return dynamicViewsModules[matchKey];
  }
  if (matchKeys?.length > 1) {
    throw new Error(
      'Please do not create `.vue` and `.TSX` files with the same file name in the same hierarchical directory under the views folder. This will cause dynamic introduction failure',
    );
  } else {
    console.warn(`Can't find ${component} in pages folder`);
  }
  return EXCEPTION_COMPONENT;
}

const actions = {
  async initRoutes({ commit }, routes) {
    // let accessedRouters = filterAsyncRouter(routes);
    const accessedRouters = transformObjectToRoutes(routes);

    // accessedRouters.push({ path: '*', redirect: '/login', component: () => import('@/pages/login/index.vue') })
    console.log(accessedRouters)
    // special token
    // if (roles.includes('ALL_ROUTERS')) {
    //   accessedRouters = asyncRouterList;
    // } else {
    //   accessedRouters = filterPermissionsRouters(asyncRouterList, roles);
    // }

    // commit('setRouters', accessedRouters);
    commit('setRouters', accessedRouters);

    // register routers
    router.addRoutes(accessedRouters);
  },
  async restore({ commit }) {
    // remove routers
    // resetRouter();
    commit('setRouters', []);
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
// 遍历后台传来的路由字符串，转换为组件对象

// 遍历后台传来的路由字符串，转换为组件对象
// function filterAsyncRouter(asyncRouterMap) {
//   return asyncRouterMap.filter(route => {
//     if (route.path) {
//       // Layout组件特殊处理
//       route.component = loadView(route.path)
//       route.meta = {
//         title: route.title
//       }
//     }
//     if (route.children != null && route.children && route.children.length) {
//       route.children = filterAsyncRouter(route.children)
//     }
//     return true
//   })
// }
// export const loadView = (view) => {
//   if (process.env.NODE_ENV === 'development') {
//     // @ts-ignore
//     return (resolve) => require(`@/pages/${view}`, resolve)
//   } else {
//     // 使用 import 实现生产环境的路由懒加载
//     return () => import(`@/pages${view}`)
//   }
// }
//
