<template>
  <BaseDialog
    v-model="dialog"
    :width="1000"
    title="创建istio端点认证"
    icon="mdi-vector-point"
    @reset="reset"
  >
    <template #content>
      <component
        :is="formComponent"
        :ref="formComponent"
        title="PeerAuthentication"
      />
    </template>
    <template #action>
      <v-btn
        class="float-right"
        color="primary"
        text
        :loading="Circular"
        @click="addIstioPeerAuthentication"
      >
        确定
      </v-btn>
    </template>
  </BaseDialog>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { postAddIstioPeerAuthentication } from '@/api'
import BaseResource from '@/mixins/resource'
import IstioAuthorizationPolicySchema from '@/views/microservice/istio/peer-authentication/mixins/schema'

export default {
  name: 'AddPeerAuthentication',
  mixins: [BaseResource, IstioAuthorizationPolicySchema],
  data: () => ({
    dialog: false,
    formComponent: 'BaseYamlForm',
  }),
  computed: {
    ...mapState(['Circular', 'EnvironmentFilter']),
    ...mapGetters(['VirtualSpace']),
  },
  methods: {
    // eslint-disable-next-line vue/no-unused-properties
    open() {
      this.dialog = true
    },
    async addIstioPeerAuthentication() {
      if (this.$refs[this.formComponent].$refs.form.validate(true)) {
        let data = ''
        if (this.formComponent === 'BaseYamlForm') {
          data = this.$refs[this.formComponent].kubeyaml
          data = this.$yamlload(data)
          if (!this.m_resource_validateJsonSchema(this.schema, data)) {
            return
          }
          if (!this.m_resource_checkDataWithOutNS(data)) return
          data = this.m_resource_beautifyData(data)
        }
        await postAddIstioPeerAuthentication(
          this.EnvironmentFilter.cluster,
          this.EnvironmentFilter.namespace,
          data.metadata.name,
          data,
        )
        this.reset()
        this.$emit('refresh')
      }
    },
    reset() {
      this.dialog = false
      this.$refs[this.formComponent].reset()
      this.formComponent = 'BaseYamlForm'
    },
  },
}
</script>
