<template>
  <div>
    <v-row>
      <v-col cols="3">
        <v-card
          class="mx-auto status-pos my-4"
          height="102px"
        >
          <v-list-item three-line>
            <v-list-item-content class="pb-2">
              <v-list-item-title
                class="text-subtitle-1 mb-1 primary--text font-weight-medium"
              >
                任务中心
              </v-list-item-title>
              <v-list-item-subtitle class="text-body-2 text--lighten-4">
                状态：
                <span class="text-body-2 deploy-line-height">
                  <template
                    v-if="taskStatus === 'Running' || taskStatus === 'Pending'"
                  >
                    <v-icon
                      color="warning"
                      class="kubegems__waiting-circle-flashing icon-font-status"
                    >
                      mdi-autorenew
                    </v-icon>
                    <span class="warning--text">
                      {{
                        taskType === 'switch-strategy'
                          ? '策略变更中'
                          : '部署任务执行中'
                      }}
                    </span>
                  </template>
                  <template v-else-if="taskStatus === 'Success'">
                    <v-icon
                      color="success"
                      class="icon-font-status"
                    >
                      mdi-check-circle
                    </v-icon>
                    <span class="success--text">
                      {{
                        taskType === 'switch-strategy'
                          ? '策略变更完成'
                          : '部署任务已完成'
                      }}
                    </span>
                  </template>
                  <template v-else-if="taskStatus === 'Error'">
                    <v-menu
                      top
                      open-on-hover
                      :close-delay="200"
                      nudge-bottom="8px"
                    >
                      <template #activator="{ on }">
                        <span
                          class="error--text"
                          style="cursor: pointer;"
                          v-on="on"
                        >
                          <v-icon
                            color="error"
                            class="icon-font-status"
                          >
                            mdi-close-circle
                          </v-icon>
                          {{
                            taskType === 'switch-strategy'
                              ? '策略变更失败'
                              : '部署任务执行失败'
                          }}
                        </span>
                      </template>
                      <v-card>
                        <v-card-text class="pa-2">
                          {{ taskErrorMsg }}
                        </v-card-text>
                      </v-card>
                    </v-menu>
                  </template>
                  <template v-else>未知</template>
                </span>
                <v-btn
                  class="mt-n1"
                  color="primary"
                  small
                  text
                  @click="viewDeployStep"
                >
                  查看详情
                </v-btn>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-card>
        <v-card class="mx-auto status-pos my-4">
          <v-list-item three-line>
            <v-list-item-content class="pb-2">
              <v-list-item-title
                class="text-subtitle-1 mb-1 primary--text font-weight-medium"
              >
                正在运行
              </v-list-item-title>
              <v-list-item-subtitle class="text-body-2 text--lighten-4">
                镜像：
                <v-flex
                  v-for="(image, index) in running ? running.images : []"
                  :key="index"
                  class="ml-4 pr-2"
                  style="overflow: hidden;"
                >
                  {{ image }}
                </v-flex>
              </v-list-item-subtitle>
              <v-list-item-subtitle class="text-body-2 text--lighten-4">
                状态：{{ running ? running.status : '' }}
              </v-list-item-subtitle>
              <v-list-item-subtitle class="text-body-2 text--lighten-4">
                副本数：{{
                  running && running.replicas ? running.replicas : '未知'
                }}
              </v-list-item-subtitle>
              <v-list-item-subtitle
                class="text-body-2 text--lighten-4 pod-show"
              >
                Pods：
                <v-flex v-if="running && running.pods">
                  <DeployPodTip :pods="running.pods" />
                </v-flex>
                <v-flex
                  v-else
                  class="text-center"
                >
                  暂无Pod
                </v-flex>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-card>
        <v-card>
          <v-card-text v-if="status">
            <v-list-item-title
              class="text-subtitle-1 mb-1 primary--text font-weight-medium"
            >
              部署策略
            </v-list-item-title>
            <v-list-item-subtitle class="text-body-2 text--lighten-4 pb-1">
              策略：{{ status ? status.strategy : '' }}
            </v-list-item-subtitle>
            <template v-if="status && status.strategy === 'Canary'">
              <v-list-item-subtitle class="text-body-2 text--lighten-4 pb-1">
                步骤：{{ status ? status.step : '' }}
              </v-list-item-subtitle>
              <v-list-item-subtitle class="text-body-2 text--lighten-4 pb-1">
                预设权重：{{ status ? status.setWeight : '' }}
              </v-list-item-subtitle>
              <v-list-item-subtitle class="text-body-2 text--lighten-4 pb-1">
                实际权重：{{ status ? status.actualWeight : '' }}
              </v-list-item-subtitle>
            </template>
            <v-list-item-subtitle
              class="text-body-2 text--lighten-4 pb-1"
              style="white-space: inherit;"
            >
              信息：{{ status ? status.message : '' }}
            </v-list-item-subtitle>
            <v-list-item-subtitle class="text-body-2 text--lighten-4">
              部署状态：
              <span
                :class="`v-avatar mr-1 ${
                  status && status.status === 'Progressing'
                    ? 'kubegems__waiting-flashing'
                    : ''
                }`"
                :style="`height: 10px; min-width: 10px; width: 10px; margin-top: -2px; background-color: ${
                  $ARGO_ROLLOUT_STATUS_COLOR[status ? status.status : '']
                };`"
              />
              {{ status ? status.status : '' }}
              <v-btn
                v-if="
                  status &&
                    (status.strategy === 'Canary' ||
                      status.strategy === 'BlueGreen')
                "
                color="primary"
                small
                text
                @click="showTrafficPanel"
              >
                查看详情
              </v-btn>
            </v-list-item-subtitle>
          </v-card-text>
        </v-card>
        <v-card class="mt-4">
          <v-list-item three-line>
            <v-list-item-content class="pb-2">
              <v-list-item-title
                class="text-subtitle-1 mb-1 primary--text font-weight-medium"
              >
                服务访问方式
              </v-list-item-title>
              <v-list-item-subtitle class="text-body-2 text--lighten-4">
                Service IP：{{ service ? service.serviceIP : '' }}
              </v-list-item-subtitle>
              <v-list-item-subtitle class="text-body-2 text--lighten-4">
                Port：
                <v-flex
                  v-for="(port, index) in service ? service.ports : []"
                  :key="index"
                  class="ml-4 pr-2"
                  style="overflow: hidden;"
                >
                  <v-chip
                    small
                    color="primary"
                  >
                    {{ port.port }}
                    <span v-if="port.nodePort"> : {{ port.nodePort }}</span>
                    | {{ port.protocol }}
                  </v-chip>
                </v-flex>
              </v-list-item-subtitle>
              <v-list-item-subtitle class="text-body-2 text--lighten-4">
                Ingress：
                <v-flex
                  v-for="(ingress, index) in service ? service.ingresses : []"
                  :key="index"
                  class="ml-4 pr-2"
                  style="overflow: hidden;"
                >
                  <v-chip
                    small
                    color="primary"
                  >
                    {{ ingress.host }} | {{ ingress.ingressPort }}
                  </v-chip>
                </v-flex>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-card>
      </v-col>
      <v-col cols="9">
        <DeployCard
          class="mt-1"
          :status="status"
        />

        <v-row>
          <v-col
            v-for="(replicaSet, index) in status ? status.replicaSets : []"
            :key="index"
            :cols="4"
            class="my-0 py-1"
          >
            <v-card
              class="mx-auto status-pos"
              height="100%"
            >
              <v-list-item three-line>
                <v-list-item-content class="pb-2">
                  <v-list-item-title
                    class="text-subtitle-1 mb-1 primary--text font-weight-medium"
                  >
                    Revision {{ replicaSet.revision }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-body-2 text--lighten-4">
                    镜像：
                    <v-flex
                      v-for="(image, index) in replicaSet.images"
                      :key="index"
                      class="ml-4 pr-2"
                      style="overflow: hidden;"
                    >
                      {{ image }}
                    </v-flex>
                  </v-list-item-subtitle>
                  <v-list-item-subtitle class="text-body-2 text--lighten-4">
                    ReplicaSet：{{ replicaSet.objectMeta.name }}
                  </v-list-item-subtitle>
                  <v-list-item-subtitle
                    class="text-body-2 text--lighten-4 pod-show"
                  >
                    Pods：
                    <v-flex v-if="replicaSet.pods">
                      <DeployPodTip :pods="replicaSet.pods" />
                    </v-flex>
                    <v-flex
                      v-else
                      class="text-center"
                    >
                      暂无Pod
                    </v-flex>
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>

              <template
                v-if="
                  !replicaSet.canary &&
                    !replicaSet.stable &&
                    replicaSet.revision &&
                    replicaSet.status === 'ScaledDown'
                "
              >
                <v-flex class="pt-6" />
                <v-card-actions class="pt-0 status-action-pos">
                  <v-spacer />
                  <v-btn
                    text
                    small
                    color="primary"
                    @click="
                      deployControll('回滚版本', 'undo', {
                        revision: `${replicaSet.revision}`,
                      })
                    "
                  >
                    回滚
                  </v-btn>
                </v-card-actions>
              </template>

              <v-flex
                v-if="replicaSet.canary || replicaSet.stable"
                class="status-watermark-bg"
              />
              <v-flex
                v-if="replicaSet.canary || replicaSet.stable"
                class="status-watermark font-weight-medium"
              >
                {{
                  replicaSet.canary
                    ? 'Canary'
                    : replicaSet.stable
                      ? 'Stable'
                      : replicaSet.preview
                        ? 'Preview'
                        : ''
                }}
              </v-flex>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <DeployStepPanel
      ref="deployStepPanel"
      @refresh="refresh"
    />
    <DeployStepStatus ref="deployStepStatus" />
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { postStrategyDeployEnvironmentAppsControl, getAppRelatedServices } from '@/api'
import DeployCard from './DeployCard'
import DeployStepPanel from './DeployStepPanel'
import DeployStepStatus from './DeployStepStatus'
import DeployPodTip from './DeployPodTip'
import BaseResource from '@/mixins/resource'

export default {
  name: 'DeployControlCenter',
  components: {
    DeployCard,
    DeployStepPanel,
    DeployStepStatus,
    DeployPodTip,
  },
  mixins: [BaseResource],
  props: {
    app: {
      type: Object,
      default: () => null,
    },
  },
  data: () => ({
    status: null,
    statusSSE: null,
    running: null,
    service: null,

    deployStatusSSE: null,
    taskStatus: null,
    taskErrorMsg: '',
    taskType: '',
  }),
  computed: {
    ...mapState(['JWT']),
    ...mapGetters(['Project', 'Tenant', 'Environment']),
  },
  watch: {
    app: {
      handler() {
        if (this.app) {
          this.strategyDeployEnvironmentAppsStatus()
          this.switchStrategyDeployTaskStatus()
          this.appRelatedServices()
        }
      },
      immediate: true,
    },
  },
  created() {
    window.addEventListener('beforeunload', this.closeStatusSSE)
    window.addEventListener('unload', this.closeStatusSSE)

    window.addEventListener('beforeunload', this.closeDeployStatusSSE)
    window.addEventListener('unload', this.closeDeployStatusSSE)
  },
  destroyed() {
    this.closeStatusSSE()
    this.closeDeployStatusSSE()
    window.removeEventListener('beforeunload', this.closeStatusSSE)
    window.removeEventListener('unload', this.closeStatusSSE)

    window.removeEventListener('beforeunload', this.closeDeployStatusSSE)
    window.removeEventListener('unload', this.closeDeployStatusSSE)
  },
  methods: {
    strategyDeployEnvironmentAppsStatus() {
      const url = `/api/v1/tenant/${this.Tenant().ID}/project/${
        this.Project().ID
      }/environment/${this.Environment().ID}/applications/${
        this.$route.params.name
      }/strategydeploystatus?token=${this.JWT}&watch=true`
      const vue = this
      this.statusSSE = new EventSource(url, { withCredentials: true })
      this.statusSSE.onopen = () => {}
      this.statusSSE.addEventListener(
        'data',
        function (event) {
          if (event.data && event.data.length > 0) {
            const data = JSON.parse(event.data)
            vue.status = data
            if (data.replicaSets && data.replicaSets.length > 0) {
              if (data.strategy === 'Canary' || data.strategy === 'BlueGreen') {
                vue.running = data.replicaSets.find((r) => {
                  return r.stable
                })
              } else {
                vue.running = data.replicaSets[0]
              }
            }
          }
        },
        false,
      )
      this.statusSSE.onerror = () => {
        // this.$store.commit('SET_SNACKBAR', {
        //   text: `${JSON.stringify(e)}`,
        //   color: 'error',
        // })
      }
      this.statusSSE.addEventListener(
        'err',
        function () {
          vue.closeStatusSSE()
        },
        false,
      )
    },
    closeStatusSSE() {
      if (this.statusSSE) {
        this.statusSSE.close()
      }
    },
    viewDeployStep() {
      this.$refs.deployStepStatus.init()
      this.$refs.deployStepStatus.open()
    },
    async appRelatedServices() {
      const data = await getAppRelatedServices(
        this.Tenant().ID,
        this.Project().ID,
        this.Environment().ID,
        this.$route.params.name,
        { noprocessing: true },
      )
      this.service = data
    },
    showTrafficPanel() {
      this.$refs.deployStepPanel.init(this.status)
      this.$refs.deployStepPanel.open()
    },
    deployControll(title, command, args = {}) {
      this.$store.commit('SET_CONFIRM', {
        title: title,
        content: {
          text:
            command === 'undo'
              ? `回滚版本 ${args.revision}`
              : `${title} ${this.$route.params.name}`,
          type: 'confirm',
          name: this.$route.params.name,
        },
        param: { command, args },
        doFunc: async (param) => {
          await postStrategyDeployEnvironmentAppsControl(
            this.Tenant().ID,
            this.Project().ID,
            this.Environment().ID,
            this.$route.params.name,
            {
              command: param.command,
              args: param.args,
            },
          )
          this.closeStatusSSE()
          this.strategyDeployEnvironmentAppsStatus()
        },
      })
    },
    refresh() {
      this.closeStatusSSE()
      this.closeDeployStatusSSE()
      this.strategyDeployEnvironmentAppsStatus()
      this.switchStrategyDeployTaskStatus()
    },
    async switchStrategyDeployTaskStatus() {
      const url = `/api/v1/tenant/${this.Tenant().ID}/project/${
        this.Project().ID
      }/environment/${this.Environment().ID}/applications/${
        this.$route.params.name
      }/tasks?token=${this.JWT}&limit=1&watch=true`
      const vue = this
      this.deployStatusSSE = new EventSource(url, { withCredentials: true })
      this.deployStatusSSE.onopen = () => {}
      this.deployStatusSSE.addEventListener(
        'data',
        function (event) {
          if (event.data && event.data.length > 0) {
            const data = JSON.parse(event.data)
            if (data && data.length > 0) {
              const task = data[0]
              if (task.status) {
                vue.taskStatus = task.status.status
                if (task.status.status === 'Error') {
                  vue.taskErrorMsg = task.status.message
                }
              }
              if (task.addtionals) {
                vue.taskType = task.addtionals.type
              }
            }
          }
        },
        false,
      )
      this.deployStatusSSE.onerror = () => {
        // this.$store.commit('SET_SNACKBAR', {
        //   text: `建立连接失败`,
        //   color: 'error',
        // })
      }
      this.deployStatusSSE.addEventListener(
        'err',
        function () {
          vue.closeDeployStatusSSE()
        },
        false,
      )
    },
    closeDeployStatusSSE() {
      if (this.deployStatusSSE) {
        this.deployStatusSSE.close()
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.status-pos {
  position: relative;
  background-color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-watermark-bg {
  position: absolute;
  width: 110px;
  height: 90px;
  transform: rotate(47deg);
  top: -46px;
  right: -55px;
  background-color: #1e88e5;
  padding: 0;
}

.status-watermark {
  position: absolute;
  top: 14px;
  right: -1px;
  transform: rotate(47deg);
  text-transform: uppercase;
  color: white;
  font-size: 12px;
}

.status-action-pos {
  position: absolute;
  bottom: 0;
  right: 0;
}

.container-tip {
  position: absolute;
  top: 50%;
  transform: translate(-0%, -50%);
  left: 0;
  right: 0;
  text-align: center;
}

.pod-show {
  overflow: hidden;
  height: auto;
  white-space: inherit;
}
.mx-0-5 {
  margin-right: 2px;
}

.icon-font {
  font-size: 24px !important;
}

.icon-font-status {
  font-size: 18px !important;
}

.deploy-line-height {
  line-height: 28px;
}

.error-msg {
  max-width: 500px;
}
</style>
