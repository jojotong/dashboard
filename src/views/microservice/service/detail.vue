<template>
  <v-container fluid>
    <BaseMicroServiceHeader :selectable="false" />
    <BaseBreadcrumb :breadcrumb="breadcrumb">
      <template #extend>
        <v-flex
          v-if="service && service.istioSidecar"
          class="kubegems__full-right"
        >
          <v-btn
            v-if="m_permisson_virtualSpaceAllow"
            text
            small
            class="primary--text"
            :disabled="!(mode === 'request_routing' || mode === null)"
            @click="initReuqestRouting"
          >
            <v-icon
              left
              small
            >
              fas fa-code-branch
            </v-icon>
            请求路由
          </v-btn>
          <v-btn
            v-if="m_permisson_virtualSpaceAllow"
            text
            small
            class="primary--text"
            :disabled="!(mode === 'fault_injection' || mode === null)"
            @click="initFaultInjection"
          >
            <v-icon
              left
              small
            >
              fas fa-eye-dropper
            </v-icon>
            故障注入
          </v-btn>
          <v-btn
            v-if="m_permisson_virtualSpaceAllow"
            text
            small
            class="primary--text"
            :disabled="!(mode === 'traffic_shifting' || mode === null)"
            @click="initTrafficShifting"
          >
            <v-icon
              left
              small
            >
              fas fa-recycle
            </v-icon>
            流量切换
          </v-btn>
          <v-btn
            v-if="m_permisson_virtualSpaceAllow"
            text
            small
            class="primary--text"
            :disabled="!(mode === 'tcp_traffic_shifting' || mode === null)"
            @click="initTcpTrafficShifting"
          >
            <v-icon
              left
              small
            >
              fas fa-recycle
            </v-icon>
            TCP流量切换
          </v-btn>
          <v-btn
            v-if="m_permisson_virtualSpaceAllow"
            text
            small
            class="primary--text"
            :disabled="!(mode === 'request_timeouts' || mode === null)"
            @click="initRequestTimeouts"
          >
            <v-icon
              left
              small
            >
              fas fa-clock
            </v-icon>
            请求超时
          </v-btn>
          <v-menu
            v-if="m_permisson_virtualSpaceAllow"
            left
          >
            <template #activator="{ on }">
              <v-btn icon>
                <v-icon
                  x-small
                  color="primary"
                  v-on="on"
                >
                  fas fa-ellipsis-v
                </v-icon>
              </v-btn>
            </template>
            <v-card>
              <v-card-text class="pa-2">
                <v-flex>
                  <v-btn
                    color="error"
                    text
                    small
                    @click="clearVS"
                  >
                    清理虚拟服务
                  </v-btn>
                </v-flex>
              </v-card-text>
            </v-card>
          </v-menu>
        </v-flex>
      </template>
    </BaseBreadcrumb>

    <v-card flat>
      <v-card-text class="pa-0">
        <v-tabs
          v-model="tab"
          height="40"
          class="rounded-t pa-2"
        >
          <v-tab
            v-for="item in tabItems"
            :key="item.value"
          >
            {{ item.text }}
          </v-tab>
        </v-tabs>
        <component
          :is="tabItems[tab].value"
          :ref="tabItems[tab].value"
          type="services"
          :item="service"
          :vs="vs"
          :mode="mode"
        />
      </v-card-text>
    </v-card>

    <FaultInjection
      ref="faultInjection"
      :service="service"
      :vs="vs"
      @refresh="microServiceDetail"
    />
    <RequestRouting
      ref="requestRouting"
      :service="service"
      :vs="vs"
      @refresh="microServiceDetail"
    />
    <RequestTimeouts
      ref="requestTimeouts"
      :service="service"
      :vs="vs"
      @refresh="microServiceDetail"
    />
    <TcpTrafficShifting
      ref="tcpTrafficShifting"
      :service="service"
      :vs="vs"
      @refresh="microServiceDetail"
    />
    <TrafficShifting
      ref="trafficShifting"
      :service="service"
      :vs="vs"
      @refresh="microServiceDetail"
    />
  </v-container>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { getMicroServiceDetail, postResetService } from '@/api'
import ResourceInfo from '@/views/microservice/components/ResourceInfo'
import NetworkTopologyIframe from '@/views/microservice/components/NetworkTopologyIframe'
import InboundTrafficIframe from '@/views/microservice/components/InboundTrafficIframe'
import TraceIframe from '@/views/microservice/components/TraceIframe'
import FaultInjection from './components/FaultInjection'
import RequestRouting from './components/RequestRouting'
import RequestTimeouts from './components/RequestTimeouts'
import TcpTrafficShifting from './components/TcpTrafficShifting'
import TrafficShifting from './components/TrafficShifting'
import VSControlInfo from './components/VSControlInfo'
import BaseResource from '@/mixins/resource'
import BasePermission from '@/mixins/permission'

export default {
  name: 'ServiceDetail',
  components: {
    ResourceInfo,
    NetworkTopologyIframe,
    InboundTrafficIframe,
    TraceIframe,
    FaultInjection,
    RequestRouting,
    RequestTimeouts,
    TcpTrafficShifting,
    TrafficShifting,
    VSControlInfo,
  },
  mixins: [BaseResource, BasePermission],
  data: () => ({
    breadcrumb: {
      title: '服务',
      tip: '服务 (Service) 是定义了一类容器组的逻辑集合和一个用于访问它们的策略。',
      icon: 'mdi-network',
    },
    tab: 0,
    service: null,
    vs: null,
    mode: null,
  }),
  computed: {
    ...mapState(['JWT']),
    ...mapGetters(['VirtualSpace']),
    tabItems() {
      const items = [
        { text: '概览', value: 'ResourceInfo' },
        { text: '流量拓扑', value: 'NetworkTopologyIframe' },
        { text: '入口流量', value: 'InboundTrafficIframe' },
        { text: '链路追踪', value: 'TraceIframe' },
      ]
      if (this.mode === 'fault_injection') {
        items.push({ text: '故障注入', value: 'VSControlInfo' })
      } else if (this.mode === 'request_timeouts') {
        items.push({ text: '请求超时', value: 'VSControlInfo' })
      } else if (this.mode === 'request_routing') {
        items.push({ text: '请求路由', value: 'VSControlInfo' })
      } else if (this.mode === 'traffic_shifting') {
        items.push({ text: '流量切换', value: 'VSControlInfo' })
      } else if (this.mode === 'tcp_traffic_shifting') {
        items.push({ text: 'tcp流量切换', value: 'VSControlInfo' })
      }
      return items
    },
  },
  mounted() {
    if (this.JWT) {
      this.$nextTick(() => {
        this.microServiceDetail()
      })
    }
  },
  methods: {
    async microServiceDetail() {
      const data = await getMicroServiceDetail(
        this.VirtualSpace().ID,
        this.$route.query.environmentid,
        this.$route.params.name,
        {
          noprocessing: true,
        },
      )
      this.service = data
      this.parseVS()
    },
    parseVS() {
      if (
        this.service &&
        this.service.virtualServices &&
        this.service.virtualServices.length > 0
      ) {
        const vs = this.service.virtualServices[0]
        if (!vs.metadata || !vs.metadata.labels) return
        this.mode = vs.metadata.labels.kiali_wizard
        if (this.mode === 'fault_injection') {
          this.vs = { fault: vs.spec.http[0].fault }
        } else if (this.mode === 'request_timeouts') {
          this.vs = {
            timeout: vs.spec.http[0].timeout,
            retries: vs.spec.http[0].retries,
          }
        } else if (this.mode === 'request_routing') {
          const headers =
            vs.spec.http[0].match &&
            vs.spec.http[0].match.find((m) => {
              return m.headers
            })
          const uri =
            vs.spec.http[0].match &&
            vs.spec.http[0].match.find((m) => {
              return m.uri
            })
          this.vs = {
            route: vs.spec.http[0].route,
            match: [
              {
                headers: headers ? headers.headers : {},
                uri: uri ? uri.uri : {},
              },
            ],
          }
        } else if (this.mode === 'traffic_shifting') {
          this.vs = { route: vs.spec.http[0].route }
        } else if (this.mode === 'tcp_traffic_shifting') {
          this.vs = { route: vs.spec.tcp[0].route }
        }
      } else {
        this.vs = null
        this.mode = null
      }
    },
    initReuqestRouting() {
      this.$refs.requestRouting.init()
      this.$refs.requestRouting.open()
    },
    initFaultInjection() {
      this.$refs.faultInjection.init()
      this.$refs.faultInjection.open()
    },
    initTrafficShifting() {
      this.$refs.trafficShifting.init()
      this.$refs.trafficShifting.open()
    },
    initTcpTrafficShifting() {
      this.$refs.tcpTrafficShifting.init()
      this.$refs.tcpTrafficShifting.open()
    },
    initRequestTimeouts() {
      this.$refs.requestTimeouts.init()
      this.$refs.requestTimeouts.open()
    },
    clearVS() {
      this.$store.commit('SET_CONFIRM', {
        title: `清理虚拟服务与规则`,
        content: {
          text: `清理虚拟服务与规则`,
          type: 'confirm',
        },
        param: {},
        doFunc: async () => {
          await postResetService(
            this.VirtualSpace().ID,
            this.$route.query.environmentid,
            this.$route.params.name,
          )
          this.microServiceDetail(true)
        },
      })
    },
  },
}
</script>
