<template>
  <BaseDialog
    v-model="dialog"
    :width="1000"
    title="创建istio边车"
    icon="mdi-motorbike"
    @reset="reset"
  >
    <template #content>
      <component
        :is="formComponent"
        :ref="formComponent"
        title="Sidecar"
      />
    </template>
    <template #action>
      <v-btn
        class="float-right"
        color="primary"
        text
        :loading="Circular"
        @click="addIstioSidecar"
      >
        确定
      </v-btn>
    </template>
  </BaseDialog>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { postAddIstioSidecar } from '@/api'
import BaseResource from '@/mixins/resource'
import IstioSidecarSchema from '@/views/microservice/istio/sidecar/mixins/schema'

export default {
  name: 'AddSidecar',
  mixins: [BaseResource, IstioSidecarSchema],
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
    async addIstioSidecar() {
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
        await postAddIstioSidecar(
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
