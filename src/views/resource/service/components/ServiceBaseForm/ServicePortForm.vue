<template>
  <v-form
    ref="form"
    v-model="valid"
    lazy-validation
    class="my-2"
    @submit.prevent
  >
    <v-expand-transition>
      <v-card
        v-show="expand"
        class="my-2 pa-2 kubegems__expand-transition"
        :elevation="4"
      >
        <v-card-text class="pa-0">
          <v-sheet class="pt-2 px-2">
            <v-flex
              class="float-left text-subtitle-2 pt-5 primary--text kubegems__min-width"
            >
              <span>端口定义</span>
            </v-flex>
            <v-flex class="float-left ml-2 kubegems__form-width">
              <v-text-field
                v-model="port.name"
                class="my-0"
                required
                label="名称"
                :rules="portRules.nameRule"
              />
            </v-flex>
            <div class="kubegems__clear-float" />
          </v-sheet>

          <v-sheet class="px-2">
            <v-flex
              class="float-left text-subtitle-2 py-1 primary--text kubegems__min-width"
            />
            <v-flex class="float-left ml-2 kubegems__form-width">
              <v-text-field
                v-model="port.targetPort"
                class="my-0"
                required
                label="容器端口"
                :rules="portRules.targetPortRule"
              />
            </v-flex>
            <v-flex class="float-left ml-2 kubegems__form-width">
              <v-text-field
                v-model="port.port"
                class="my-0"
                required
                type="number"
                label="服务端口"
                :rules="portRules.portRule"
              />
            </v-flex>
            <div class="kubegems__clear-float" />
          </v-sheet>
        </v-card-text>
        <v-card-actions class="pa-0">
          <v-spacer />
          <v-btn
            text
            small
            color="error"
            @click="closeCard"
          >
            取消
          </v-btn>
          <v-btn
            text
            small
            color="primary"
            @click="addData"
          >
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-expand-transition>
  </v-form>
</template>

<script>
import { deepCopy } from '@/utils/helpers'
import { required, positiveInteger } from '@/utils/rules'

export default {
  name: 'ServicePortForm',
  props: {
    data: {
      type: Array,
      default: () => null,
    },
  },
  data() {
    return {
      valid: false,
      expand: false,
      portsCopy: {},
      port: {
        index: -1,
        name: '',
        protocol: 'TCP',
        port: '',
        targetPort: '',
      },
      portRules: {
        nameRule: [
          (v) =>
            !!new RegExp(
              '^(http)([-\\w]+)?$|^(https)([-\\w]+)?$|^(http2)([-\\w]+)?$|^(grpc)([-\\w]+)?$|^(tcp)([-\\w]+)?$|^(udp)([-\\w]+)?$|^(tls)([-\\w]+)?$|^(mongo)([-\\w]+)?$|^(mysql)([-\\w]+)?$|^(redis)([-\\w]+)?$',
              'g',
            ).test(v) || '名称格式错误（<protocol>[-<suffix>]）',
        ],
        portRule: [required],
        targetPortRule: [required],
        sessionRule: [
          positiveInteger,
          (v) => !!parseInt(v) > 86400 || '超出最大限制',
        ],
      },
    }
  },
  watch: {
    data() {
      this.portsCopy = deepCopy(this.data)
    },
  },
  mounted() {
    if (this.data) {
      this.portsCopy = deepCopy(this.data)
    }
  },
  methods: {
    // eslint-disable-next-line vue/no-unused-properties
    init(data) {
      this.port = data
      this.expand = true
    },
    addData() {
      if (this.$refs.form.validate(true)) {
        if (!this.portsCopy) this.portsCopy = []
        if (this.port.index === -1) {
          this.portsCopy.push({
            name: this.port.name,
            protocol: this.port.protocol,
            port: this.port.port,
            targetPort: this.port.targetPort,
          })
        } else {
          const port = this.portsCopy[this.port.index]
          port.name = this.port.name
          port.protocol = this.port.protocol
          port.port = this.port.port
          port.targetPort = this.port.targetPort
          this.$set(this.portsCopy, this.port.index, port)
        }
        this.$emit('addData', this.portsCopy)
        this.closeCard()
      }
    },
    closeCard() {
      this.expand = false
      this.port = deepCopy(this.$options.data().port)
      this.$refs.form.resetValidation()
      this.$emit('closeOverlay')
    },
  },
}
</script>
