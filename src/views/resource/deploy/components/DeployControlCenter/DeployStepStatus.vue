<template>
  <BaseDialog
    v-model="dialog"
    title="任务步骤状态"
    :width="1000"
    icon="fas fa-bullseye"
    @reset="reset"
  >
    <template #header>
      <span class="ml-3">
        {{ $route.params.name }}
      </span>
    </template>
    <template #content>
      <v-flex
        v-if="stages.length > 0"
        class="pa-1"
      >
        <v-stepper
          v-model="step"
          vertical
          non-linear
        >
          <template v-for="(stage, index) in stages">
            <v-stepper-step
              :key="`s${index}`"
              :complete="
                stage.data &&
                  stage.data.findIndex((s) => {
                    return s.status && s.status.status !== 'Success'
                  }) === -1
              "
              :rules="
                stage.data
                  ? [
                    () =>
                      stage.data.findIndex((s) => {
                        return s.status && s.status.status !== 'Error'
                      }) > -1,
                  ]
                  : []
              "
              :step="`${index + 1}`"
              class="text-subtitle-1 kubegems__role font-weight-medium"
              edit-icon="mdi-check"
              error-icon="mdi-close-circle"
            >
              步骤{{ index + 1 }}: {{ stage.name }}
            </v-stepper-step>
            <v-stepper-content
              :key="`c${index}`"
              :step="`${index + 1}`"
            >
              <v-card
                class="my-0"
                flat
              >
                <v-data-table
                  disable-sort
                  :headers="headers"
                  :items="stage.nodata ? [] : stage.data"
                  :items-per-page="100"
                  no-data-text="暂无部署数据"
                  hide-default-footer
                  single-expand
                  show-expand
                  item-key="ID"
                  @click:row="onRowClick"
                >
                  <template #[`item.task`]="{ item }">
                    {{ item.name }}
                  </template>
                  <template #[`item.startAt`]="{ item }">
                    {{
                      item.status && item.status.startTimestamp
                        ? $moment(item.status.startTimestamp).format(
                          'YYYY年MM月DD日 HH:mm:ss',
                        )
                        : ''
                    }}
                  </template>
                  <template #[`item.endAt`]="{ item }">
                    {{
                      item.status && item.status.finishTimestamp
                        ? $moment(item.status.finishTimestamp).format(
                          'YYYY年MM月DD日 HH:mm:ss',
                        )
                        : ''
                    }}
                  </template>
                  <template #[`item.status`]="{ item }">
                    <template
                      v-if="
                        item && item.status && item.status.status === 'Success'
                      "
                    >
                      <v-icon
                        color="success"
                        small
                      >
                        mdi-check-circle
                      </v-icon>
                      执行完成
                    </template>
                    <template
                      v-else-if="
                        item && item.status && item.status.status === 'Error'
                      "
                    >
                      <v-icon
                        color="error"
                        small
                      >
                        mdi-alert-circle
                      </v-icon>
                      执行失败
                    </template>
                    <template
                      v-else-if="
                        item && item.status && item.status.status === 'Running'
                      "
                    >
                      <v-icon
                        color="warning"
                        class="kubegems__waiting-circle-flashing"
                        small
                      >
                        mdi-sync
                      </v-icon>
                      执行中
                    </template>
                    <template
                      v-else-if="
                        item && item.status && item.status.status === 'Pending'
                      "
                    >
                      <v-icon
                        color="grey"
                        small
                      >
                        mdi-timer-sand
                      </v-icon>
                      等待执行
                    </template>
                  </template>
                  <template #expanded-item="{ headers, item }">
                    <td
                      :colspan="headers.length"
                      class="my-2 py-2"
                    >
                      <span>错误信息：</span>
                      <span>
                        {{
                          item.status &&
                            item.status.message &&
                            item.status.message.length > 0
                            ? item.status.message
                            : '暂无'
                        }}
                      </span>
                    </td>
                  </template>
                </v-data-table>
              </v-card>
            </v-stepper-content>
          </template>
        </v-stepper>
      </v-flex>
      <v-flex
        v-else
        class="grey lighten-4 rounded-0 ma-2"
      >
        <v-list-item two-line>
          <v-list-item-content class="py-2">
            <v-list-item-subtitle class="text-body-2 py-0 text-center">
              暂无任务
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-flex>
    </template>
  </BaseDialog>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import BaseResource from '@/mixins/resource'

export default {
  name: 'DeployStepStatus',
  mixins: [BaseResource],
  data() {
    return {
      dialog: false,
      statusSSE: null,
      step: 1,
      headers: [
        { text: '任务', value: 'task', align: 'start', width: 200 },
        { text: '开始时间', value: 'startAt', align: 'start' },
        { text: '结束时间', value: 'endAt', align: 'start' },
        { text: '状态', value: 'status', align: 'start' },
        { text: '', value: 'data-table-expand' },
      ],
      stages: [],
    }
  },
  computed: {
    ...mapState(['JWT', 'Scale']),
    ...mapGetters(['Tenant', 'Project', 'Environment']),
  },
  created() {
    window.addEventListener('beforeunload', this.closeStatusSSE)
    window.addEventListener('unload', this.closeStatusSSE)
  },
  destroyed() {
    this.closeStatusSSE()
    window.removeEventListener('beforeunload', this.closeStatusSSE)
    window.removeEventListener('unload', this.closeStatusSSE)
  },
  methods: {
    // eslint-disable-next-line vue/no-unused-properties
    open() {
      this.dialog = true
    },
    // eslint-disable-next-line vue/no-unused-properties
    init() {
      this.showDeployStepStatus()
      const interval = window.setInterval(() => {
        const eles = document.getElementsByClassName('v-stepper__wrapper')
        if (eles && eles.length > 0) {
          clearInterval(interval)
          for (const index in eles) {
            if (eles[index].style) eles[index].style.height = 'auto'
          }
        }
      }, 500)
    },
    showDeployStepStatus() {
      const url = `/api/v1/tenant/${this.Tenant().ID}/project/${
        this.Project().ID
      }/environment/${this.Environment().ID}/applications/${
        this.$route.params.name
      }/tasks?token=${this.JWT}&limit=1&watch=true`
      const vue = this
      this.statusSSE = new EventSource(url, { withCredentials: true })
      this.statusSSE.onopen = () => {}
      this.statusSSE.addEventListener(
        'data',
        function (event) {
          if (event.data && event.data.length > 0) {
            const data = JSON.parse(event.data)
            if (data.length > 0) {
              vue.stages = data[0].steps.map((s) => {
                return {
                  name: s.name,
                  data: [{ ...s }],
                }
              })
            } else {
              vue.stages = []
            }
          }
        },
        false,
      )
      this.statusSSE.onerror = () => {
        // this.$store.commit('SET_SNACKBAR', {
        //   text: `建立连接失败`,
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
      this.stages = []
    },
    reset() {
      this.closeStatusSSE()
    },
    onRowClick(item, { expand, isExpanded }) {
      expand(!isExpanded)
    },
  },
}
</script>

<style lang="scss" scoped>
.v-stepper--vertical .v-stepper__content {
  padding: 0 60px 0 23px;
}
</style>
