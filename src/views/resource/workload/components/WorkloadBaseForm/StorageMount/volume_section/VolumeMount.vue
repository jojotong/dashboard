<template>
  <v-form
    v-if="mounts"
    ref="form"
    v-model="valid"
    lazy-validation
    @submit.prevent
  >
    <v-sheet
      v-for="(container, index) in containers"
      :key="index"
      class="px-2"
    >
      <v-flex class="float-left text-subtitle-2 pt-6 primary--text kubegems__min-width">
        {{ container.name }}
      </v-flex>
      <v-flex class="float-left ml-2 kubegems__form-width">
        <v-autocomplete
          v-model="mounts[container.name].readOnly"
          :items="readModes"
          color="primary"
          label="挂载方式"
          hide-selected
          no-data-text="暂无可选数据"
        >
          <template #selection="{ item }">
            <v-chip
              color="primary"
              small
              class="mx-1"
            >
              {{ item['text'] }}
            </v-chip>
          </template>
        </v-autocomplete>
      </v-flex>
      <v-flex class="float-left ml-2 kubegems__form-width">
        <v-text-field
          v-if="mounts[container.name].readOnly !== null"
          v-model="mounts[container.name].mountPath"
          required
          label="挂载路径"
          :rules="mountRules[container.name].mountPathRule"
        />
      </v-flex>
      <v-flex class="float-left text-subtitle-2 pt-4 primary--text kubegems__min-width" />
      <v-flex class="float-left ml-2 kubegems__form-width">
        <v-text-field
          v-if="mounts[container.name].readOnly !== null"
          v-model="mounts[container.name].subPath"
          required
          label="子路径"
        />
      </v-flex>
      <div class="kubegems__clear-float" />
    </v-sheet>
  </v-form>
</template>

<script>
import BaseResource from '@/mixins/resource'
import { required } from '@/utils/rules'

export default {
  name: 'VolumeMount',
  mixins: [BaseResource],
  props: {
    containers: {
      type: Array,
      default: () => [],
    },
    volume: {
      type: Object,
      default: () => null,
    },
    volumeMountName: {
      type: String,
      default: () => null,
    },
  },
  data() {
    return {
      valid: false,
      mounts: null,
    }
  },
  computed: {
    readModes() {
      if (this.volume && (this.volume.secret || this.volume.configmap)) {
        return [
          { text: '只读', value: true },
          { text: '不挂载', value: null },
        ]
      }
      return [
        { text: '只读', value: true },
        { text: '读写', value: false },
        { text: '不挂载', value: null },
      ]
    },
    mountRules() {
      const mountRules = {}
      this.containers.forEach((c) => {
        const rules = {}
        rules['mountPathRule'] = [required]
        mountRules[c.name] = rules
      })
      return mountRules
    },
  },
  mounted() {
    this.initVolumeMount()
  },
  methods: {
    initVolumeMount(volumeName = null) {
      const mounts = {}
      this.containers.forEach((c) => {
        if (!c.volumeMounts) c.volumeMounts = []
        const volume = c.volumeMounts.find((v) => {
          return v.name === this.volumeMountName ? this.volumeMountName : ''
        })
        if (volume) {
          mounts[c.name] = {
            mountPath: volume.mountPath,
            readOnly: volume.readOnly ? volume.readOnly : false,
            name: volume.name,
            subPath: volume.subPath,
          }
        } else {
          mounts[c.name] = {
            mountPath: '',
            readOnly: null,
            name: this.volume ? this.volume.name : volumeName || '',
            subPath: '',
          }
        }
      })
      this.mounts = mounts
    },
    // eslint-disable-next-line vue/no-unused-properties
    generateData() {
      if (this.$refs.form.validate(true)) {
        return this.mounts
      }
      return null
    },
  },
}
</script>
