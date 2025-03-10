<template>
  <v-container fluid>
    <BaseMicroServiceHeader />
    <BaseBreadcrumb :breadcrumb="breadcrumb" />
    <v-card>
      <v-card-title class="pa-2">
        <EnvironmentFilter :ml="6" />
        <v-spacer />
      </v-card-title>
      <v-card-text class="pa-2">
        <iframe
          v-if="$route.query.cluster"
          id="graph"
          :src="src"
          allow
          width="100%"
          :height="height"
          class="iframe"
          @load="loadDataComplete"
        />
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import { mapState } from 'vuex'
import EnvironmentFilter from '@/views/microservice/components/EnvironmentFilter'

export default {
  name: 'Graph',
  components: {
    EnvironmentFilter,
  },
  data() {
    return {
      breadcrumb: {
        title: '服务调用图',
        tip: '服务调用图 (DAG) 是一个或多个命名空间下的所有负载服务调用链路关系图。',
        icon: 'mdi-vector-polyline',
      },
      timeinterval: null,
    }
  },
  computed: {
    ...mapState(['Scale']),
    height() {
      return window.innerHeight - 220 * this.Scale - 1
    },
    src() {
      return `/api/v1/service-proxy/cluster/${this.$route.query.cluster}/namespace/istio-system/service/kiali/port/20001/kiali/console/graph/namespaces?graphType=workload&injectServiceNodes=true&namespaces=${this.$route.query.namespace}&edges=trafficRate%2Cthroughput%2CthroughputRequest&traffic=grpc%2CgrpcRequest%2Chttp%2ChttpRequest%2Ctcp%2CtcpSent&idleNodes=false&duration=60&refresh=30000&operationNodes=false&idleEdges=false&layout=dagre&boxNamespace=true&animation=true&badgeSecurity=true&kiosk=true`
    },
  },
  watch: {
    '$store.state.EnvironmentFilter': {
      handler: function (env) {
        if (env) {
          this.$store.commit('SET_PROGRESS', true)
        }
      },
      deep: true,
      immediate: true,
    },
  },
  destroyed() {
    if (this.timeinterval) clearInterval(this.timeinterval)
  },
  mounted() {
    this.$store.commit('SET_PROGRESS', true)
  },
  methods: {
    loadDataComplete() {
      this.$store.commit('SET_PROGRESS', false)
      this.timeinterval = setInterval(() => {
        const iframe = document.getElementById('graph')
        if (iframe) {
          const namespace =
            iframe.contentWindow.document.getElementById('namespace-selector')
          if (namespace) {
            this.removeBar()
          }
          const headers =
            iframe.contentWindow.document.getElementsByClassName(
              'pf-c-breadcrumb',
            )
          if (headers) {
            this.removeTrafficBar()
          }
        }
      }, 500)
    },
    removeTrafficBar() {
      const iframe = document.getElementById('graph')
      const headers =
        iframe.contentWindow.document.getElementsByClassName('pf-c-breadcrumb')
      if (headers && headers.length > 0) {
        const header = headers[0]
        header.parentElement.removeChild(header)
      }
    },
    removeBar() {
      const iframe = document.getElementById('graph')
      const namespace =
        iframe.contentWindow.document.getElementById(
          'namespace-selector',
        ).parentNode
      if (namespace) {
        namespace.parentElement.removeChild(namespace)
      }
      const splits =
        iframe.contentWindow.document.getElementsByClassName('fr78t9r')
      if (splits && splits.length > 0) {
        const split = splits[0]
        split.parentElement.removeChild(split)
      }
      const fpomfbys =
        iframe.contentWindow.document.getElementsByClassName('fpomfby')
      if (fpomfbys && fpomfbys.length > 0) {
        const fpomfby = fpomfbys[0]
        fpomfby.style.marginLeft = '0px'
      }
      const toolbars =
        iframe.contentWindow.document.getElementsByClassName('f1ct87rs')
      if (toolbars && toolbars.length > 0) {
        const toolbar = toolbars[0]
        toolbar.parentElement.removeChild(toolbar)
      }
      const secondBars =
        iframe.contentWindow.document.getElementsByClassName('f1ocs92y')
      if (secondBars && secondBars.length > 0) {
        const secondBar = secondBars[0]
        const dispaly = secondBar.children[0]
        const findHide = secondBar.children[1]
        dispaly.style.position = 'initial'
        dispaly.style.float = 'left'

        const firstBars =
          iframe.contentWindow.document.getElementsByClassName('fcq4l43')
        if (firstBars && firstBars.length > 0) {
          const firstBar = firstBars[0]
          firstBar.append(dispaly)
          firstBar.append(findHide)
        }
        const header = iframe.contentWindow.document.getElementById(
          'global-namespace-selector',
        )
        header.style.marginBottom = '15px'
        secondBar.parentElement.removeChild(secondBar)
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.iframe {
  border: none;
}
</style>
