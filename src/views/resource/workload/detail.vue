<template>
  <v-container fluid>
    <BaseViewportHeader :selectable="false" />
    <BaseBreadcrumb :breadcrumb="breadcrumb">
      <template #extend>
        <v-flex class="kubegems__full-right">
          <span class="text-subtitle-2 mx-2">
            CPU: {{ cpu.val }}
            <v-menu
              id="cpu"
              nudge-top="-5px"
              nudge-right="25px"
              top
              open-on-hover
              :close-delay="200"
            >
              <template #activator="{ on }">
                <v-icon
                  v-if="cpu.trend === 'up'"
                  color="error"
                  v-on="on"
                >
                  mdi-trending-up
                </v-icon>
                <v-icon
                  v-else-if="cpu.trend === 'down'"
                  color="success"
                  v-on="on"
                >
                  mdi-trending-down
                </v-icon>
                <v-icon
                  v-else-if="cpu.trend === 'neutral'"
                  color="primary"
                  v-on="on"
                >
                  mdi-trending-neutral
                </v-icon>
              </template>
              <v-card>
                <v-card-text class="pa-2"> 间隔30s cpu实时变化 </v-card-text>
              </v-card>
            </v-menu>
          </span>
          <span class="text-subtitle-2 mx-2">
            内存: {{ memory.val }}
            <v-menu
              id="memory"
              nudge-top="-5px"
              nudge-right="25px"
              top
              open-on-hover
              :close-delay="200"
            >
              <template #activator="{ on }">
                <v-icon
                  v-if="memory.trend === 'up'"
                  color="error"
                  v-on="on"
                >
                  mdi-trending-up
                </v-icon>
                <v-icon
                  v-else-if="memory.trend === 'down'"
                  color="success"
                  v-on="on"
                >
                  mdi-trending-down
                </v-icon>
                <v-icon
                  v-else-if="memory.trend === 'neutral'"
                  color="primary"
                  v-on="on"
                >
                  mdi-trending-neutral
                </v-icon>
              </template>
              <v-card>
                <v-card-text class="pa-2"> 间隔30s 内存实时变化 </v-card-text>
              </v-card>
            </v-menu>
          </span>
          <template
            v-if="
              workload &&
                workload.metadata.annotations &&
                !workload.metadata.annotations[`gems.${$DOMAIN}/ref`]
            "
          >
            <v-btn
              v-if="$route.query.type !== 'DaemonSet' && m_permisson_resourceAllow"
              text
              small
              class="primary--text"
              @click="scaleReplicas"
            >
              <v-icon
                left
                small
              >
                fas fa-arrows-alt-v
              </v-icon>
              调整副本数
            </v-btn>
            <v-btn
              v-if="m_permisson_resourceAllow"
              text
              small
              class="primary--text"
              @click="rollingback"
            >
              <v-icon
                left
                small
              >
                fas fa-redo-alt
              </v-icon>
              回滚
            </v-btn>
            <v-btn
              v-if="$route.query.type !== 'DaemonSet' && m_permisson_resourceAllow"
              text
              small
              class="primary--text"
              @click="hpaStrategy"
            >
              <v-icon
                left
                small
              >
                fas fa-cogs
              </v-icon>
              弹性伸缩策略
            </v-btn>
          </template>
          <v-btn
            text
            small
            class="primary--text"
            @click="resourceYaml"
          >
            <v-icon
              left
              small
            >
              fas fa-code
            </v-icon>
            Yaml
          </v-btn>
          <v-menu
            v-if="m_permisson_resourceAllow"
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
                    color="primary"
                    text
                    small
                    @click="updateWorkload"
                  >
                    编辑
                  </v-btn>
                </v-flex>
                <v-flex>
                  <v-btn
                    color="error"
                    text
                    small
                    @click="removeWorkload"
                  >
                    删除
                  </v-btn>
                </v-flex>
              </v-card-text>
            </v-card>
          </v-menu>
        </v-flex>
      </template>
    </BaseBreadcrumb>
    <v-row class="mt-0">
      <v-col
        cols="2"
        class="pt-0"
      >
        <BasicResourceInfo :item="workload" />
      </v-col>
      <v-col
        cols="10"
        class="pt-0"
      >
        <v-card flat>
          <v-card-text class="pa-0">
            <v-tabs
              v-model="tab"
              height="40"
              class="rounded-t pl-2 pt-2"
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
              :item="workload"
              :selector="{
                topkind: $route.query.type,
                topname: workload ? workload.metadata.name : '',
              }"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <ScaleReplicas
      ref="scaleReplicas"
      :item="workload"
      :kind="$route.query.type"
      @refresh="workloadDetail"
    />
    <HPAStrategy
      ref="hpaStrategy"
      :item="workload"
    />
    <Rollingback
      ref="rollingback"
      :item="workload"
      @refresh="workloadDetail"
    />
    <ResourceYaml
      ref="resourceYaml"
      :item="workload"
    />
    <UpdateWorkload
      ref="updateWorkload"
      @refresh="workloadDetail"
    />
  </v-container>
</template>

<script>
import { mapState } from 'vuex'
import {
  getDaemonSetDetail,
  getDeploymentDetail,
  getStatefulSetDetail,
  deleteDaemonSet,
  deleteStatefulSet,
  deleteDeployment,
  vector,
} from '@/api'
import ResourceInfo from './components/ResourceInfo'
import Metadata from '@/views/resource/components/metadata/Metadata'
import PodList from '@/views/resource/components/common/PodList'
import EventList from '@/views/resource/components/common/EventList'
import WorkloadMonitor from './components/WorkloadMonitor'
import ScaleReplicas from './components/ScaleReplicas'
import HPAStrategy from './components/HPAStrategy'
import Rollingback from './components/Rollingback'
import ResourceYaml from '@/views/resource/components/common/ResourceYaml'
import BasicResourceInfo from '@/views/resource/components/common/BasicResourceInfo'
import UpdateWorkload from './components/UpdateWorkload'
import BaseResource from '@/mixins/resource'
import BasePermission from '@/mixins/permission'
import {
  WORKLOAD_CPU_USAGE_PROMQL,
  WORKLOAD_MEMORY_USAGE_PROMQL,
} from '@/utils/prometheus'
import {
  beautifyCpuUnit,
  beautifyStorageUnit,
  sizeOfCpu,
  sizeOfStorage,
} from '@/utils/helpers'

export default {
  name: 'WorkloadDetail',
  components: {
    ResourceInfo,
    Metadata,
    PodList,
    EventList,
    WorkloadMonitor,
    ScaleReplicas,
    HPAStrategy,
    ResourceYaml,
    BasicResourceInfo,
    UpdateWorkload,
    Rollingback,
  },
  mixins: [BaseResource, BasePermission],
  data: () => ({
    breadcrumb: {
      title: '工作负载',
      tip: '工作负载 (Workload) 通常是访问服务的载体,是对一组容器组 (Pod) 的抽象。',
      icon: 'mdi-vector-arrange-above',
    },
    workload: null,
    tab: 0,
    tabItems: [
      { text: '资源信息', value: 'ResourceInfo' },
      { text: '元数据', value: 'Metadata' },
      { text: '容器组', value: 'PodList' },
      { text: '事件', value: 'EventList' },
      { text: '监控', value: 'WorkloadMonitor' },
    ],
    cpu: { val: 0, trend: '' },
    memory: { val: 0, trend: '' },
    cpuInterval: null,
    memoryInterval: null,
  }),
  computed: {
    ...mapState(['JWT', 'MessageStreamWS']),
  },
  watch: {
    '$store.state.MessageStream': {
      handler: function (updatingWorkload) {
        if (!updatingWorkload) return
        const workload = JSON.parse(updatingWorkload)
        if (workload.MessageType !== 'objectChanged') return
        if (
          workload.Content &&
          this.workload &&
          workload.Content.metadata.name === this.workload.metadata.name
        ) {
          if (workload.EventKind === 'delete') {
            this.$router.push({ name: 'workload-list' })
          } else {
            this.workload = workload.Content
          }
        }
      },
      deep: true,
      immediate: true,
    },
  },
  destroyed() {
    if (this.cpuInterval) {
      clearInterval(this.cpuInterval)
    }
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval)
    }
  },
  mounted() {
    if (this.JWT) {
      this.$nextTick(() => {
        this.workloadDetail()
      })
    }
  },
  methods: {
    async workloadDetail() {
      let data = {}
      if (this.$route.query.type === 'DaemonSet') {
        data = await getDaemonSetDetail(
          this.ThisCluster,
          this.$route.query.namespace,
          this.$route.params.name,
        )
      } else if (this.$route.query.type === 'Deployment') {
        data = await getDeploymentDetail(
          this.ThisCluster,
          this.$route.query.namespace,
          this.$route.params.name,
        )
      } else if (this.$route.query.type === 'StatefulSet') {
        data = await getStatefulSetDetail(
          this.ThisCluster,
          this.$route.query.namespace,
          this.$route.params.name,
        )
      }
      this.workload = data
      this.cpuUsed(false)
      this.memoryUsed(false)
      this.cpuInterval = setInterval(() => {
        this.cpuUsed()
      }, 1000 * 30)
      this.memoryInterval = setInterval(() => {
        this.memoryUsed()
      }, 1000 * 30)
      this.watchWorkload()
    },
    watchWorkload() {
      const sub = {
        kind: 'objectChanged',
        content: {},
      }
      const watchWorkloadList = []
      watchWorkloadList.push(
        `${this.workload.metadata.namespace}/${this.workload.metadata.name}`,
      )
      sub.content[this.ThisCluster] = {}
      sub.content[this.ThisCluster][this.$route.query.type] = watchWorkloadList
      if (this.MessageStreamWS && this.MessageStreamWS.readyState === 1) {
        this.MessageStreamWS.send(JSON.stringify(sub))
      }
    },
    async cpuUsed(trend = true) {
      const data = await vector(this.ThisCluster, {
        query: WORKLOAD_CPU_USAGE_PROMQL
          .replaceAll('$1', `${this.workload.metadata.namespace}`)
          .replaceAll(
            '$2',
            `${this.$route.query.type}:${this.workload.metadata.name}`,
          ),
        noprocessing: true,
      })
      if (data && data.length > 0) {
        if (trend) {
          const oldval = sizeOfCpu(this.cpu.val, 'n')
          const newval = data[0].value[1] * 1000000
          if (newval > oldval) {
            this.cpu.trend = 'up'
          } else if (newval < oldval) {
            this.cpu.trend = 'down'
          } else {
            this.cpu.trend = 'neutral'
          }
        }
        this.cpu.val = beautifyCpuUnit(data[0].value[1] * 1000000)
      }
    },
    async memoryUsed(trend = true) {
      const data = await vector(this.ThisCluster, {
        query: WORKLOAD_MEMORY_USAGE_PROMQL
          .replaceAll('$1', `${this.workload.metadata.namespace}`)
          .replaceAll(
            '$2',
            `${this.$route.query.type}:${this.workload.metadata.name}`,
          ),
        noprocessing: true,
      })
      if (data && data.length > 0) {
        if (trend) {
          const oldval = sizeOfStorage(this.memory.val, 'B')
          const newval = data[0].value[1] * 1024 * 1024
          if (newval > oldval) {
            this.memory.trend = 'up'
          } else if (newval < oldval) {
            this.memory.trend = 'down'
          } else {
            this.memory.trend = 'neutral'
          }
        }
        this.memory.val = beautifyStorageUnit(data[0].value[1] * 1024 * 1024)
      }
    },
    resourceYaml() {
      this.$refs.resourceYaml.open()
    },
    scaleReplicas() {
      this.$refs.scaleReplicas.open()
    },
    rollingback() {
      this.$refs.rollingback.init()
      this.$refs.rollingback.open()
    },
    hpaStrategy() {
      this.$refs.hpaStrategy.init()
      this.$refs.hpaStrategy.open()
    },
    updateWorkload() {
      this.$refs.updateWorkload.init(this.workload, this.$route.query.type)
      this.$refs.updateWorkload.open()
    },
    removeWorkload() {
      const item = this.workload
      if (this.$route.query.type === 'DaemonSet') {
        this.$store.commit('SET_CONFIRM', {
          title: `删除守护进程服务`,
          content: {
            text: `删除守护进程服务 ${item.metadata.name}`,
            type: 'delete',
            name: item.metadata.name,
          },
          param: { item },
          doFunc: async (param) => {
            await deleteDaemonSet(
              this.ThisCluster,
              this.$route.query.namespace,
              param.item.metadata.name,
            )
            this.$router.push({ name: 'workload-list' })
          },
        })
      } else if (this.$route.query.type === 'StatefulSet') {
        this.$store.commit('SET_CONFIRM', {
          title: `删除有状态服务`,
          content: {
            text: `删除有状态服务 ${item.metadata.name}`,
            type: 'delete',
            name: item.metadata.name,
          },
          param: { item },
          doFunc: async (param) => {
            await deleteStatefulSet(
              this.ThisCluster,
              this.$route.query.namespace,
              param.item.metadata.name,
            )
            this.$router.push({ name: 'workload-list' })
          },
        })
      } else if (this.$route.query.type === 'Deployment') {
        this.$store.commit('SET_CONFIRM', {
          title: `删除无状态服务`,
          content: {
            text: `删除无状态服务 ${item.metadata.name}`,
            type: 'delete',
            name: item.metadata.name,
          },
          param: { item },
          doFunc: async (param) => {
            await deleteDeployment(
              this.ThisCluster,
              this.$route.query.namespace,
              param.item.metadata.name,
            )
            this.$router.push({ name: 'workload-list' })
          },
        })
      }
    },
  },
}
</script>

<style lang="scss" scoped>
#cpu {
  display: inline-block !important;
}

#memory {
  display: inline-block !important;
}
</style>
