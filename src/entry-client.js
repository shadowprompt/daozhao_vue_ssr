/* eslint-disable */
import Vue from 'vue';
import register from './plugin';
Vue.use(register);
import { createApp } from './app';

Vue.mixin({
  beforeMount() {
    const { asyncData } = this.$options;
    if (asyncData) {
      // 将获取数据操作分配给 promise
      // 以便在组件中，我们可以在数据准备就绪后
      // 通过运行 `this.dataPromise.then(...)` 来执行其他任务
      // this.dataPromise = asyncData({
      //   store: this.$store,
      //   route: this.$route,
      // });
    }
  },
});

Vue.mixin({
  beforeRouteUpdate(to, from, next) {
    console.log('client beforeRouteUpdate -> ');
    const { asyncData } = this.$options;

    if (asyncData) {
      asyncData({
        store: this.$store,
        route: to,
      })
        .then(next)
        .catch(next);
    } else {
      next();
    }
  },
});

const { app, router, store } = createApp();

if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__);
}

router.onReady(() => {
  // console.log('client onReady -> ', 1);

  // 添加路由钩子函数，用于处理 asyncData.
  // 在初始路由 resolve 后执行，
  // 以便我们不会二次预取(double-fetch)已有的数据。
  // 使用 `router.beforeResolve()`，以便确保所有异步组件都 resolve。
  router.beforeResolve((to, from, next) => {
    console.log('client beforeResolve -> ');

    const matched = router.getMatchedComponents(to);
    const prevMatched = router.getMatchedComponents(from);
    // 我们只关心之前没有渲染的组件
    // 所以我们对比它们，找出两个匹配列表的差异组件
    let diffed = false;
    let activated = [];
    if (prevMatched.length < matched.length) {
      activated = matched;
    } else {
      activated = matched.filter((c, i) => {
        return diffed || (diffed = prevMatched[i] !== c);
      });
    }
    const isUnderSameRouter = matched.every(
      (c, i) => prevMatched[i].name === c.name,
    );

    // 如果没有activated，则判断是否是同一个组件间的路由改变
    const target = activated.length
      ? activated
      : isUnderSameRouter
      ? matched
      : [];
    if (!target.length) {
      return next();
    }
    // 这里如果有加载指示器(loading indicator)，就触发
    Promise.all(
      target.map((c) => {
        if (c.asyncData) {
          return c.asyncData({ store, route: to, vm: c });
        }
      }),
    )
      .then(() => {
        // 停止加载指示器(loading indicator)
        next();
      })
      .catch(next);
  });
  app.$mount('#app');
});
