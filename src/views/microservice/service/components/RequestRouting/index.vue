<template>
  <BaseDialog
    v-model="dialog"
    :width="1000"
    title="请求路由"
    icon="mdi-source-branch"
    @reset="reset"
  >
    <template #content>
      <component
        :is="formComponent"
        :ref="formComponent"
        :service="service"
        :vs="vs"
        title="RequestRouting"
      />
    </template>
    <template #action>
      <v-btn
        class="float-right"
        color="primary"
        text
        :loading="Circular"
        @click="addRequestRouting"
      >
        确定
      </v-btn>
    </template>
  </BaseDialog>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { postAddRequestRouting } from '@/api'
import RequestRoutingBaseForm from './RequestRoutingBaseForm'
import BaseResource from '@/mixins/resource'

export default {
  name: 'RequestRouting',
  components: {
    RequestRoutingBaseForm,
  },
  mixins: [BaseResource],
  props: {
    service: {
      type: Object,
      default: () => null,
    },
    vs: {
      type: Object,
      default: () => null,
    },
  },
  data: () => ({
    dialog: false,
    yaml: false,
    formComponent: 'RequestRoutingBaseForm',
  }),
  computed: {
    ...mapState(['Circular']),
    ...mapGetters(['VirtualSpace']),
  },
  methods: {
    // eslint-disable-next-line vue/no-unused-properties
    open() {
      this.dialog = true
    },
    async addRequestRouting() {
      if (this.$refs[this.formComponent].$refs.form.validate(true)) {
        let data = ''
        if (this.formComponent === 'RequestRoutingBaseForm') {
          data = this.$refs[this.formComponent].obj
          data = this.m_resource_beautifyData(data)
        }
        await postAddRequestRouting(
          this.VirtualSpace().ID,
          this.$route.query.environmentid,
          this.$route.params.name,
          [data],
        )
        this.reset()
        this.$emit('refresh')
      }
    },
    // eslint-disable-next-line vue/no-unused-properties
    init() {
      this.formComponent = 'RequestRoutingBaseForm'
    },
    reset() {
      this.dialog = false
      this.$refs[this.formComponent].reset()
      this.formComponent = ''
      this.yaml = false
    },
  },
}
</script>
