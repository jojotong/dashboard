<template>
  <BaseDialog
    v-model="dialog"
    :width="1000"
    title="创建告警规则"
    icon="mdi-ruler"
    @reset="reset"
  >
    <template #content>
      <component
        :is="formComponent"
        :ref="formComponent"
        :step="step"
        title="PrometheusRule"
      />
    </template>
    <template #action>
      <v-btn
        v-if="step === totalStep - 1"
        class="float-right mx-2"
        color="primary"
        text
        :loading="Circular"
        @click="addPrometheusRule"
      >
        确定
      </v-btn>
      <v-btn
        v-if="step >= 0 && step < totalStep - 1"
        class="float-right mx-2"
        color="primary"
        text
        @click="nextStep"
      >
        下一步
      </v-btn>
      <v-btn
        v-if="step > 0 && step <= totalStep - 1"
        class="float-right mx-2"
        color="primary"
        text
        @click="lastStep"
      >
        上一步
      </v-btn>
    </template>
  </BaseDialog>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { postAddPrometheusRule } from '@/api'
import PrometheusRuleBaseForm from './PrometheusRuleBaseForm'
import BaseResource from '@/mixins/resource'
import { deepCopy } from '@/utils/helpers'

export default {
  name: 'PrometheusRule',
  components: {
    PrometheusRuleBaseForm,
  },
  mixins: [BaseResource],
  data: () => ({
    dialog: false,
    formComponent: 'PrometheusRuleBaseForm',
    step: 0,
    totalStep: 2,
  }),
  computed: {
    ...mapState(['Circular', 'AdminViewport']),
    ...mapGetters(['Project', 'Environment']),
  },
  methods: {
    // eslint-disable-next-line vue/no-unused-properties
    open() {
      this.dialog = true
    },
    // 增加初始值
    // eslint-disable-next-line vue/no-unused-properties
    init(initData) {
      if (initData) {
        this.$nextTick(() => {
          this.$refs[this.formComponent].$refs.Rule.obj = initData
          this.$refs[this.formComponent].$refs.Rule.setLabelpairs(
            initData.labelpairs,
          )
        })
      }
    },
    async addPrometheusRule() {
      if (this.$refs[this.formComponent].validate(true)) {
        const obj = deepCopy(this.$refs[this.formComponent].obj)

        // 移除labelpairs中的空值
        for (const key in obj.labelpairs) {
          if (!obj.labelpairs[key]) {
            delete obj.labelpairs[key]
          }
        }

        await postAddPrometheusRule(
          this.ThisCluster || obj.cluster,
          this.AdminViewport
            ? obj.namespace
            : this.ThisNamespace || obj.namespace,
          obj,
        )
        this.reset()
        this.$emit('refresh')
      }
    },

    lastStep() {
      if (this.step > 0) {
        const data = this.$refs[this.formComponent].obj
        this.step -= 1
        this.$nextTick(() => {
          this.$refs[this.formComponent].back(data)
        })
      }
    },
    nextStep() {
      if (
        this.step < this.totalStep - 1 &&
        this.$refs[this.formComponent].validate()
      ) {
        const data = this.$refs[this.formComponent].obj
        if (
          !data.alertLevels ||
          (data.alertLevels && data.alertLevels.length === 0)
        ) {
          this.$store.commit('SET_SNACKBAR', {
            text: '请添加告警级别',
            color: 'warning',
          })
          return
        }
        this.step += 1
        this.$nextTick(() => {
          this.$refs[this.formComponent].init(data)
        })
      }
    },
    reset() {
      this.dialog = false
      this.$refs[this.formComponent].reset()
      this.step = 0
      this.formComponent = 'PrometheusRuleBaseForm'
    },
  },
}
</script>
