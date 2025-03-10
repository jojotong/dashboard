<template>
  <v-card flat>
    <v-card-text class="px-0 pt-1 pb-0">
      <v-flex class="ma-1">
        <v-sheet class="text-body-2 primary--text float-right mt-n1">
          <span class="kubegems__detail"> 容器 </span>
          <v-menu
            v-model="containerMenu"
            bottom
            left
            offset-y
            origin="top center"
            transition="scale-transition"
            nudge-bottom="5px"
          >
            <template #activator="{ on }">
              <v-btn
                depressed
                color="white"
                class="primary--text mt-n1"
                dark
                v-on="on"
              >
                {{ container }}
                <v-icon
                  v-if="containerMenu"
                  right
                >
                  fas fa-angle-up
                </v-icon>
                <v-icon
                  v-else
                  right
                >
                  fas fa-angle-down
                </v-icon>
              </v-btn>
            </template>
            <v-data-iterator
              :items="[{ text: '容器', values: containers }]"
              hide-default-footer
            >
              <template #no-data>
                <v-card>
                  <v-card-text> 暂无容器 </v-card-text>
                </v-card>
              </template>
              <template #default="props">
                <v-card
                  v-for="item in props.items"
                  :key="item.text"
                >
                  <v-list dense>
                    <v-flex class="text-subtitle-2 text-center ma-2">
                      <span>容器</span>
                    </v-flex>
                    <v-divider class="mx-2" />
                    <v-list-item
                      v-for="(con, index) in item.values"
                      :key="index"
                      class="text-body-2 text-center"
                      link
                      :style="
                        con.text === container
                          ? `color: #1e88e5 !important;`
                          : ``
                      "
                      @click="setContainer(con)"
                    >
                      <v-list-item-content>
                        <span class="font-weight-medium">
                          {{ con.text }}
                        </span>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list>
                </v-card>
              </template>
            </v-data-iterator>
          </v-menu>
        </v-sheet>
        <v-sheet class="text-body-2 primary--text float-right mt-n1">
          <span class="kubegems__detail"> 容器组 </span>
          <v-menu
            v-model="podMenu"
            bottom
            left
            offset-y
            origin="top center"
            transition="scale-transition"
            nudge-bottom="5px"
          >
            <template #activator="{ on }">
              <v-btn
                depressed
                color="white"
                class="primary--text mt-n1"
                dark
                v-on="on"
              >
                {{ pod.metadata.name }}
                <v-icon
                  v-if="podMenu"
                  right
                >
                  fas fa-angle-up
                </v-icon>
                <v-icon
                  v-else
                  right
                >
                  fas fa-angle-down
                </v-icon>
              </v-btn>
            </template>
            <v-data-iterator
              :items="[{ text: '容器组', values: pods }]"
              hide-default-footer
            >
              <template #no-data>
                <v-card>
                  <v-card-text> 暂无容器组 </v-card-text>
                </v-card>
              </template>
              <template #default="props">
                <v-card
                  v-for="item in props.items"
                  :key="item.text"
                >
                  <v-list dense>
                    <v-flex class="text-subtitle-2 text-center ma-2">
                      <span>容器组</span>
                    </v-flex>
                    <v-divider class="mx-2" />
                    <v-list-item
                      v-for="(p, index) in item.values"
                      :key="index"
                      class="text-body-2 text-center"
                      link
                      :style="
                        p.metadata.name === pod.metadata.name
                          ? `color: #1e88e5 !important;`
                          : ``
                      "
                      @click="setPod(p)"
                    >
                      <v-list-item-content>
                        <span class="font-weight-medium">
                          {{ p.metadata.name }}
                        </span>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list>
                </v-card>
              </template>
            </v-data-iterator>
          </v-menu>
        </v-sheet>

        <v-flex class="text-subtitle-2 float-right primary--text">
          <span class="kubegems__detail"> 实时 </span>
          <v-switch
            v-model="stream"
            class="pl-2 primary--text float-right switch-mt"
            color="primary"
            hide-details
            dense
            @change="onStreamSwitchChange"
          />
        </v-flex>
        <div class="kubegems__clear-float" />
      </v-flex>
      <ACEEditor
        ref="log"
        v-model="log"
        :class="`clear-zoom-${Scale.toString().replaceAll('.', '-')} rounded-0`"
        lang="yaml"
        :options="
          Object.assign($aceOptions, {
            readOnly: true,
            wrap: false,
          })
        "
        theme="chrome"
        :style="`height: ${height}px !important`"
        @init="$aceinit"
        @keydown.stop
      />
    </v-card-text>
  </v-card>
</template>
<script>
import { mapState } from 'vuex'
import { getPodList } from '@/api'
import BaseResource from '@/mixins/resource'

export default {
  name: 'WorkloadLog',
  mixins: [BaseResource],
  props: {
    item: {
      type: Object,
      default: () => null,
    },
  },
  data: () => ({
    container: '',
    containers: [],
    pod: { metadata: {} },
    pods: [],
    log: '',
    logWebsocket: null,
    stream: true,
    linenotbreak: true,
    containerMenu: false,
    podMenu: false,
  }),
  computed: {
    ...mapState(['JWT', 'Scale']),
    height() {
      return window.innerHeight - 64 * this.Scale - 1
    },
  },
  watch: {
    item: {
      handler() {
        this.$nextTick(() => {
          this.init()
        })
      },
      immediate: true,
    },
  },
  destroyed() {
    this.dispose()
  },
  methods: {
    async init() {
      await this.getContainerSelectData()
      this.initWebSocket()
    },
    async podList() {
      const data = await getPodList(
        this.$route.query.cluster,
        this.$route.query.namespace,
        {
          size: 1000,
          topkind: this.$route.query.type,
          topname: this.$route.params.name,
        },
      )
      this.pods = data.List
    },
    async getContainerSelectData(pod) {
      if (!pod) {
        await this.podList()
        if (this.pods.length > 0) {
          pod = this.pods[0]
          this.pod = pod
        }
      }
      if (!pod) {
        this.$store.commit('SET_SNACKBAR', {
          text: `不存在容器组`,
          color: 'warning',
        })
        return
      }
      this.containers = []
      pod.spec.containers.forEach((i) => {
        this.containers.push({
          text: i.name,
          value: i.name,
        })
      })
      if (this.container === '') this.container = this.containers[0].value
    },
    onStreamSwitchChange() {
      if (this.logWebsocket) {
        this.logWebsocket.close()
        this.logWebsocket = null
      }
      this.initWebSocket()
    },
    setContainer(con) {
      if (this.container !== con.value) {
        this.container = con.value
        if (this.logWebsocket) {
          this.logWebsocket.close()
          this.logWebsocket = null
        }
        this.initWebSocket()
      }
    },
    async setPod(p) {
      if (this.pod.metadata.name !== p.metadata.name) {
        this.pod = p
        if (this.logWebsocket) {
          this.logWebsocket.close()
          this.logWebsocket = null
        }
        await this.getContainerSelectData(p)
        this.initWebSocket()
      }
    },
    initWebSocket() {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      const host = window.location.host
      const wsuri = `${protocol}://${host}/api/v1/proxy/cluster/${this.$route.query.cluster}/custom/core/v1/namespaces/${this.$route.query.namespace}/pods/${this.pod.metadata.name}/actions/logs?stream=true&container=${this.container}&token=${this.JWT}&tail=100&follow=${this.stream}`
      this.logWebsocket = new WebSocket(wsuri)
      this.logWebsocket.binaryType = 'arraybuffer'
      this.logWebsocket.onopen = () => {
        this.log = ''
      }
      this.logWebsocket.onmessage = this.onWebsocketMessage
      this.logWebsocket.onerror = this.onWebsocketError
      this.logWebsocket.onclose = (e) => {
        if (e.code === 1006 && this.stream) {
          this.logWebsocket = null
          this.initWebSocket()
        }
        // this.dispose()
        // this.dialog = false
      }
      if (this.$refs.log && this.$refs.log.editor) {
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
      this.stream = false
      this.linenotbreak = false
    },
  },
}
</script>

<style lang="scss" scoped>
.v-input--selection-controls {
  margin-top: 0 !important;
}
</style>
