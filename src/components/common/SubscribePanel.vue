<template>
  <section class="subscribe-container">
    <h5 class="title">订阅通知</h5>
    <div class="content">道招网关注互联网，分享IT资讯，前沿科技、编程技术，订阅后可及时收到更新通知。</div>
    <div class="sub_area">
      <div :class="'sub_btn ' + subscribeStatus" @click="this.handleNotifyClick">
        <Bell width="20px" height="20px"/>
        <span class="sub_text">{{subscribeStatusText}}</span>
      </div>
    </div>
  </section>
</template>

<script>
import Bell from './Bell.vue';

export default {
  name: 'SubscribePanel',
  components: {Bell},
  data() {
    return {
      isSubscribed: void 0,
    }
  },
  computed: {
    subscribeStatus() {
      if (this.isSubscribed === void 0) {
        return ''
      } else if (this.isSubscribed) {
        return 'subscribed';
      } else {
        return 'unsubscribed';
      }
    },
    subscribeStatusText() {
      if (this.isSubscribed) {
        return '已订阅';
      } else {
        return '订阅';
      }
    }
  },
  mounted() {
    this.$eventBus.$on('subscribeStatus', this.handleScribeStatus);
  },
  beforeMount() {
    this.$eventBus.$off('subscribeStatus', this.handleScribeStatus);
  },
  methods: {
    handleScribeStatus(value) {
      this.isSubscribed = value;
    },
    handleNotifyClick() {
      this.$eventBus.$emit('subscribe');
    },
  }
}
</script>
