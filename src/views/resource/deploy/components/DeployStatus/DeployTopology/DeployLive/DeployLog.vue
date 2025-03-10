<template>
  <v-flex
    :class="`clear-zoom-${Scale.toString().replaceAll('.', '-')}`"
    :style="`height: ${height}px !important;overflow: auto;`"
  >
    <ACEEditor
      ref="log"
      v-model="log"
      class="rounded-0"
      lang="yaml"
      :options="Object.assign($aceOptions, { readOnly: true, wrap: false })"
      theme="chrome"
      @init="$aceinit"
      @keydown.stop
    />
  </v-flex>
</template>

<script>
import { mapState } from 'vuex'
import BaseResource from '@/mixins/resource'

export default {
  name: 'DeployLog',
  mixins: [BaseResource],
  props: {
    resource: {
      type: Object,
      default: () => null,
    },
    container: {
      type: String,
      default: () => '',
    },
  },
  data: () => ({
    log: '',
    logWebsocket: null,
  }),
  computed: {
    ...mapState(['JWT', 'Scale']),
    height() {
      return window.innerHeight - 64 * this.Scale - 1 - 40 * this.Scale
    },
  },
  watch: {
    resource: {
      handler: function () {
        if (this.resource) {
          this.initWebSocket()
        }
      },
      deep: true,
      immediate: true,
    },
  },
  destroyed() {
    this.dispose()
  },
  methods: {
    initWebSocket() {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      const host = window.location.host
      const wsuri = `${protocol}://${host}/api/v1/proxy/cluster/${this.ThisCluster}/custom/core/v1/namespaces/${this.resource.namespace}/pods/${this.resource.name}/actions/logs?stream=true&container=${this.container}&token=${this.JWT}&tail=100&follow=true`
      this.logWebsocket = new WebSocket(wsuri)
      this.logWebsocket.binaryType = 'arraybuffer'
      this.logWebsocket.onmessage = this.onWebsocketMessage
      this.logWebsocket.onerror = this.onWebsocketError
      if (this.$refs.log && this.$refs.log.editor) {
        this.$refs.log.editor.setOptions({ wrap: true })
        this.$refs.log.editor.session.on('change', () => {
          this.$refs.log.editor.renderer.scrollToLine(Number.POSITIVE_INFINITY)
        })
      }
    },
    onWebsocketError(e) {
      this.$store.commit('SET_SNACKBAR', {
        text: `${JSON.stringify(e)}`,
        color: 'warning',
      })
    },
    onWebsocketMessage(e) {
      this.log += e.data
    },
    dispose() {
      if (this.logWebsocket) {
        this.logWebsocket.close()
        this.logWebsocket = null
      }
      this.log = ''
    },
    // eslint-disable-next-line vue/no-unused-properties
    refresh() {
      this.dispose()
      this.initWebSocket()
    },
  },
}
</script>
