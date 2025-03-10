<template>
  <v-form
    v-model="valid"
    lazy-validation
    class="my-2"
    @submit.prevent
  >
    <v-flex :class="expand ? 'kubegems__overlay' : ''" />
    <v-expand-transition>
      <v-card
        v-show="expand"
        class="my-2 pa-2 kubegems__expand-transition"
        :elevation="4"
      >
        <v-card-text class="pa-0">
          <v-form
            ref="form"
            v-model="valid"
            lazy-validation
            @submit.prevent
          >
            <v-sheet class="pt-2 px-2">
              <v-flex
                class="float-left text-subtitle-2 pt-5 primary--text kubegems__min-width"
              >
                <span>端口定义</span>
              </v-flex>
              <v-flex class="float-left ml-2 kubegems__form-width">
                <v-text-field
                  v-model="obj.name"
                  class="my-0"
                  required
                  label="名称"
                  :rules="objRules.nameRule"
                />
              </v-flex>
              <v-flex class="float-left ml-2 kubegems__form-width">
                <v-text-field
                  v-model="obj.containerPort"
                  class="my-0"
                  required
                  label="端口"
                  type="number"
                  :rules="objRules.containerPortRule"
                />
              </v-flex>
              <div class="kubegems__clear-float" />
            </v-sheet>
          </v-form>
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
    <v-sheet
      v-for="(item, index) in containerCopy && containerCopy.ports
        ? containerCopy.ports
        : []"
      :key="index"
      class="grey lighten-4 rounded ma-2"
    >
      <v-list-item two-line>
        <v-list-item-content class="py-2">
          <v-list-item-subtitle class="text-body-2 py-0">
            <v-list-item
              two-line
              class="float-left pa-0 kubegems__three-width"
            >
              <v-list-item-content class="py-0">
                <v-list-item-title class="text-subtitle-2 py-1">
                  {{ item.name }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-body-2 py-1">
                  名称
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-list-item
              two-line
              class="float-left pa-0 kubegems__three-width"
            >
              <v-list-item-content class="py-0">
                <v-list-item-title class="text-subtitle-2 py-1">
                  {{ item.protocol }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-body-2 py-1">
                  协议
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-list-item
              two-line
              class="float-left pa-0 kubegems__three-width"
            >
              <v-list-item-content class="py-0">
                <v-list-item-title class="text-subtitle-2 py-1">
                  {{ item.containerPort }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-body-2 py-1">
                  容器端口
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list-item-subtitle>
          <div class="kubegems__clear-float" />
        </v-list-item-content>
        <v-btn
          dark
          text
          fab
          right
          x-small
          color="primary"
          @click="updateData(index)"
        >
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn
          dark
          text
          fab
          right
          x-small
          color="error"
          @click="removeData(index)"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </v-list-item>
    </v-sheet>
    <v-flex class="grey lighten-4 rounded-0 ma-2">
      <v-list-item two-line>
        <v-list-item-content class="py-2">
          <v-list-item-subtitle class="text-body-2 py-0 text-center">
            <v-btn
              text
              color="primary"
              @click="expandCard"
            >
              <v-icon
                left
                small
              >
                mdi-plus
              </v-icon>
              添加容器端口
            </v-btn>
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-flex>
  </v-form>
</template>

<script>
import { deepCopy } from '@/utils/helpers'
import { required, port } from '@/utils/rules'

export default {
  name: 'ContainerPort',
  props: {
    container: {
      type: Object,
      default: () => null,
    },
  },
  data() {
    return {
      valid: false,
      expand: false,
      obj: {
        name: '',
        protocol: 'TCP',
        containerPort: '',
      },
      objRules: {
        nameRule: [required],
        containerPortRule: [
          port,
        ],
      },
      containerCopy: null,
    }
  },
  watch: {
    container() {
      if (this.container) this.containerCopy = deepCopy(this.container)
      else this.containerCopy = {}
    },
  },
  mounted() {
    if (this.container) this.containerCopy = deepCopy(this.container)
    else this.containerCopy = {}
  },
  methods: {
    expandCard() {
      this.expand = true
    },
    closeCard() {
      this.expand = false
      this.$refs.form.reset()
    },
    addData() {
      if (this.$refs.form.validate(true)) {
        if (!this.containerCopy.ports) {
          this.$set(this.containerCopy, 'ports', [])
        }
        const index = this.containerCopy.ports.findIndex((p) => {
          return p.containerPort === this.obj.containerPort
        })
        if (index > -1) {
          this.$set(this.containerCopy.ports, index, deepCopy(this.obj))
        } else {
          const ports = this.containerCopy.ports
          ports.push(deepCopy(this.obj))
          this.$set(this.containerCopy, 'ports', ports)
        }
        this.$emit('updateComponentData', this.containerCopy)
        this.closeCard()
      }
    },
    removeData(index) {
      this.$delete(this.containerCopy.ports, index)
      this.$emit('updateComponentData', this.containerCopy)
    },
    updateData(index) {
      const port = this.containerCopy.ports[index]
      this.obj = deepCopy(port)
      this.expandCard()
    },
  },
}
</script>
