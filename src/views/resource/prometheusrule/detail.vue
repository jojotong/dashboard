<template>
  <v-container fluid>
    <BaseViewportHeader :selectable="false" />
    <BaseBreadcrumb :breadcrumb="breadcrumb">
      <template #extend>
        <v-flex class="kubegems__full-right">
          <BaseDatetimePicker2
            v-model="date"
            :default-value="30"
            @change="onDatetimeChange"
          />
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
                    @click="updatePrometheusRule"
                  >
                    编辑
                  </v-btn>
                </v-flex>
                <v-flex>
                  <v-btn
                    color="error"
                    text
                    small
                    @click="removePrometheusRule"
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
    <v-card class="mt-0">
      <v-card-text>
        <v-row>
          <v-col cols="6">
            <BaseSubTitle title="规则详情" />
            <v-card-text>
              <pre class="yaml-pre">{{ yaml }}</pre>
            </v-card-text>
          </v-col>
          <v-col cols="6">
            <BaseSubTitle title="告警趋势" />
            <v-card-text class="pa-0">
              <AlertBarChart
                :class="`clear-zoom-${Scale.toString().replaceAll('.', '-')}`"
                :metrics="metrics"
                :extend-height="300"
                title="告警次数"
                label="name"
              />
            </v-card-text>
          </v-col>
        </v-row>
        <BaseSubTitle title="告警列表" />
        <AlertList
          ref="alertList"
        />
      </v-card-text>
    </v-card>
    <UpdatePrometheusRule
      ref="updatePrometheusRule"
      @refresh="prometheusRuleDetail"
    />
  </v-container>
</template>

<script>
import { mapState } from 'vuex'
import {
  getPrometheusRuleDetail,
  deletePrometheusRule,
  getPrometheusAlertHistory,
} from '@/api'
import UpdatePrometheusRule from './components/UpdatePrometheusRule'
import AlertList from './components/AlertList'
import AlertBarChart from './components/AlertBarChart'
import BaseResource from '@/mixins/resource'
import BasePermission from '@/mixins/permission'
import BaseAlert from './mixins/alert'

export default {
  name: 'PrometheusRuleDetail',
  components: {
    UpdatePrometheusRule,
    AlertList,
    AlertBarChart,
  },
  mixins: [BaseResource, BasePermission, BaseAlert],
  data: () => ({
    breadcrumb: {
      title: '告警规则详情',
      tip: '告警规则 (PrometheusRule) 通常是针对监控指标设置的Prometheus告警规则。',
      icon: 'mdi-ruler',
    },
    date: [],
    prometheusRule: null,
    yaml: '',
    metrics: [],
    timeArray: [],
  }),
  computed: {
    ...mapState(['JWT', 'AdminViewport', 'Admin', 'Scale']),
  },
  watch: {
    '$route.fullPath'() {
      this.prometheusRule = null
      this.init()
    },
  },
  mounted() {
    this.init()
  },
  methods: {
    init() {
      if (this.$route.query.createAt) {
        const time = new Date(this.$route.query.createAt).getTime()
        this.date = [time - 5 * 60 * 1000, time + 5 * 60 * 1000]
      }
      this.updateRule()
    },
    onDatetimeChange() {
      this.updateRule()
    },
    async prometheusRuleDetail() {
      const data = await getPrometheusRuleDetail(
        this.ThisCluster,
        this.$route.query.namespace,
        this.$route.params.name,
        {
          isAdmin: this.AdminViewport,
        },
      )
      this.yaml = this.$yamldump(data.origin.rules)
      this.prometheusRule = data
    },
    updatePrometheusRule() {
      this.$refs.updatePrometheusRule.open()
      this.$refs.updatePrometheusRule.init(this.prometheusRule)
    },
    removePrometheusRule() {
      const item = this.prometheusRule
      this.$store.commit('SET_CONFIRM', {
        title: `删除告警规则`,
        content: {
          text: `删除告警规则 ${item.name}`,
          type: 'delete',
          name: item.name,
        },
        param: { item },
        doFunc: async (param) => {
          await deletePrometheusRule(this.Environment().ID, {
            name: param.item.name,
          })
          this.$router.push({ name: 'prometheusrule-list' })
        },
      })
    },
    async updateRule() {
      this.$refs.alertList.timeParams = {
        CreatedAt_gte: this.$moment(this.date[0]).format(),
        CreatedAt_lte: this.$moment(this.date[1]).format(),
      }
      this.$refs.alertList.init()
      this.generateDateArray()
      this.prometheusRuleChart()
    },
    generateDateArray() {
      const timeStep = (this.date[1] - this.date[0]) / 10
      this.timeArray = '0123456789'
        .split('')
        .concat([10])
        .map((s) => {
          return this.date[0] + timeStep * s
        })
    },
    async prometheusRuleChart() {
      this.metrics = this.$options.data().metrics
      if (
        this.prometheusRule === null ||
        this.prometheusRule.origin.rules.length < 1
      ) {
        await this.prometheusRuleDetail()
      }

      const data = await getPrometheusAlertHistory(
        this.ThisCluster,
        this.$route.query.namespace,
        this.$route.params.name,
        {
          CreatedAt_gte: this.$moment(this.date[0]).format(),
          CreatedAt_lte: this.$moment(this.date[1]).format(),
          size: 10000,
          noprocessing: true,
        },
      )
      if (data.List) {
        const severitys = ['error', 'critical']
        severitys.forEach((severity) => {
          this.metrics.push({
            metric: { name: severity },
            values: this.timeArray.map((d) => {
              return [d, 0]
            }),
          })
        })
        data.List.forEach((d) => {
          const time = Date.parse(this.$moment(d.CreatedAt))
          const index = this.timeArray.findIndex((t) => {
            return t >= time
          })
          if (index > -1) {
            if (d.Labels.severity === 'error') {
              this.metrics[0].values[index][1] += d.Count
            } else if (d.Labels.severity === 'critical') {
              this.metrics[1].values[index][1] += d.Count
            }
          }
        })
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.yaml-pre {
  white-space: break-spaces;
  word-break: break-all;
}
</style>
