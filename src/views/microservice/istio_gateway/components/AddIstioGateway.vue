<template>
  <BaseDialog
    v-model="dialog"
    :width="500"
    title="创建网关实例"
    icon="mdi-gateway"
    @reset="reset"
  >
    <template #content>
      <component
        :is="formComponent"
        :ref="formComponent"
      />
    </template>
    <template #action>
      <v-btn
        class="float-right"
        color="primary"
        text
        :loading="Circular"
        @click="addIstioGatewayInstance"
      >
        确定
      </v-btn>
    </template>
  </BaseDialog>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { postAddIstioGatewayInstance } from '@/api'
import IstioGatewayBaseForm from './IstioGatewayBaseForm'
import BaseResource from '@/mixins/resource'

export default {
  name: 'AddIstioGateway',
  components: {
    IstioGatewayBaseForm,
  },
  mixins: [BaseResource],
  data: () => ({
    dialog: false,
    formComponent: 'IstioGatewayBaseForm',
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
    async addIstioGatewayInstance() {
      if (this.$refs[this.formComponent].$refs.form.validate(true)) {
        const data = this.$refs[this.formComponent].obj
        await postAddIstioGatewayInstance(
          this.VirtualSpace().ID,
          this.$route.query.clusterid,
          data,
        )
        this.reset()
        this.$emit('refresh')
      }
    },
    reset() {
      this.dialog = false
      this.$refs[this.formComponent].reset()
    },
  },
}
</script>
