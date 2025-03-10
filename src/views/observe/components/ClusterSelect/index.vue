<template>
  <div class="d-inline-block">
    <template v-if="mode === 'default'">
      <ClusterSelectItem
        v-for="item in items"
        :key="item.value"
        :active="current === item[valueKey]"
        :disabled="disabled"
        class="mr-3"
        @click="onSelect(item)"
      >
        集群{{ item.text }}
      </ClusterSelectItem>
    </template>
    <template v-else>
      <v-badge
        v-for="item in items"
        :key="item.value"
        :value="badgeValues[item[valueKey]] !== undefined"
        :content="badgeValues[item[valueKey]]"
        bordered
        overlap
        small
        color="success"
        class="mr-3"
      >
        <ClusterSelectItem
          :active="current === item[valueKey]"
          :disabled="disabled"
          @click="onSelect(item)"
        >
          集群{{ item.text }}
        </ClusterSelectItem>
      </v-badge>
    </template>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { clusterSelectData, tenantClusterSelectData } from '@/api'
import ClusterSelectItem from './Item'
import { deepCopy } from '@/utils/helpers'

export default {
  name: 'ClusterSelect',
  components: {
    ClusterSelectItem,
  },
  props: {
    value: {
      type: [Number, String, Object],
      default: undefined,
    },
    valueKey: {
      type: String,
      default: 'text',
      validator: (v) => ['text', 'value'].includes(v),
    },
    autoSelectFirst: {
      type: Boolean,
      default: false,
    },
    objectValue: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    clearable: {
      type: Boolean,
      default: false,
    },
    mode: {
      type: String,
      default: 'default',
      validator: (v) => ['default', 'badge'].includes(v),
    },
    badgeValues: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      items: [],
      current: undefined,
    }
  },
  computed: {
    ...mapState(['AdminViewport', 'Admin']),
    ...mapGetters(['Tenant']),
  },
  watch: {
    value: {
      handler(newValue) {
        this.current =
          newValue && this.objectValue ? newValue?.[this.valueKey] : newValue
      },
      immediate: true,
    },
  },
  mounted() {
    this.getClusters()
  },
  methods: {
    async getClusters() {
      let data = null
      if (this.Admin) {
        data = await clusterSelectData({ noprocessing: true })
      } else {
        data = await tenantClusterSelectData(this.Tenant().ID, {
          noprocessing: true,
        })
      }
      this.items = data.List.map((item) => ({
        text: item.ClusterName,
        value: item.ID,
      }))
      if (!this.current && this.autoSelectFirst && this.items.length) {
        this.onSelect(this.items[0])
      }
    },
    onEmit(value) {
      const v = this.objectValue ? deepCopy(value) : this.current
      this.$emit('input', v)
      this.$emit('change', v)
    },
    onSelect(value) {
      if (this.current === value[this.valueKey]) {
        if (this.clearable) {
          this.current = undefined
          this.onEmit(value)
        }
      } else {
        this.current = value[this.valueKey]
        this.onEmit(value)
      }
    },
  },
}
</script>
