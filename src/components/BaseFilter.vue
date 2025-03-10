<template>
  <v-sheet :width="width">
    <v-combobox
      ref="filter"
      v-model="conditions"
      color="primary"
      chips
      hide-selected
      hide-details
      label="输入查询条件进行过滤"
      multiple
      prepend-inner-icon="mdi-magnify"
      dense
      solo
      flat
      no-data-text="无数据"
      :items="items"
      :search-input.sync="filterText"
      full-width
      @change="onFilterConditionChange"
      @blur="onFilterConditionBlur"
      @focus="onFilterConditionFocus"
      @keydown.enter="contructFilterTextCondition"
    >
      <template #selection="{ attrs, item, selected }">
        <v-chip
          v-if="
            item &&
            item.text &&
            (item.items.length > 0 || item.text.indexOf(':') > -1)
          "
          :input-value="selected"
          color="primary"
          label
          small
          v-bind="attrs"
        >
          <span class="pr-2">{{ item.text }}</span>
          <v-icon small @click="onFilterConditionChange(item, 'delete')">
            mdi-close
          </v-icon>
        </v-chip>
        <span
          v-else-if="item.text && item.text.length > 0"
          class="text-body-1 font-weight-medium"
        >
          {{ item.text }}:
        </span>
      </template>
    </v-combobox>
  </v-sheet>
</template>

<script>
import { deepCopy } from '@/utils/helpers'

export default {
  name: 'BaseFilter',
  props: {
    filters: {
      type: Array,
      default: () => [],
    },
    width: {
      type: Number,
      default: () => 700,
    },
    default: {
      type: Object,
      default: () => null,
    },
    reload: {
      type: Boolean,
      default: () => true,
    },
  },
  data() {
    return {
      conditions: [],
      items: [],
      filterText: '',
    }
  },
  watch: {
    filters: {
      handler: function () {
        this.init()
      },
      deep: true,
    },
  },
  mounted() {
    this.init()
  },
  methods: {
    init() {
      this.conditions = []
      const params = this.$route.query
      const filters = deepCopy(this.filters)
      // 生成键值对
      for (const key in params) {
        if (params[key]) {
          const condition = filters.find((c) => {
            return c.value === key
          })
          if (condition !== undefined && condition.text.length > 0) {
            condition.text = `${condition.text}:${params[key]}`
            this.conditions.push(condition)
          }
        }
      }
    },
    onFilterConditionChange(item, operator) {
      if (operator === 'delete') {
        const index = this.conditions.findIndex((c) => {
          return c.value === item.value
        })
        this.conditions.splice(index, 1)
        const params = this.constructQueryParams()
        this.$emit('refresh', params, this.reload)
        if (!this.reload) this.$emit('filter')
        this.$refs.filter.blur()
      } else {
        const lastConditions = this.conditions.slice(-1)
        if (lastConditions.length === 0) return
        const condition = lastConditions[0]
        if (Object.prototype.hasOwnProperty.call(condition, 'parent')) {
          const index = this.conditions.findIndex((c) => {
            return c.value === condition.parent
          })
          if (index > -1 && this.conditions[index].text.length > 0) {
            this.conditions[
              index
            ].text = `${this.conditions[index].text}:${condition.value}`
          }
          this.conditions = this.conditions.slice(0, -1)
          this.resetFilterCondition()

          const params = this.constructQueryParams()
          this.$emit('refresh', params, this.reload)
          if (!this.reload) this.$emit('filter')
          this.$refs.filter.blur()
        } else {
          this.items = condition.items
        }
      }
    },
    contructFilterTextCondition() {
      if (this.filterText === '' || this.filterText === null) return
      let lastConditions = this.conditions.slice(-1)
      if (lastConditions.length === 0) {
        if (this.default) lastConditions = [this.default]
        else return
      }
      const condition = lastConditions[0]
      if (condition.text && condition.text.indexOf(':') > -1) {
        this.filterText = ''
        return
      }
      if (condition.text && condition.text.length === 0) {
        this.filterText = ''
        return
      }
      if (typeof condition === 'string') {
        this.filterText = ''
        return
      }
      condition.text = `${condition.text}:${this.filterText}`
      const index = this.conditions.findIndex((c) => {
        return c.value === condition.value
      })
      this.conditions.splice(index, 1)
      this.conditions.push(condition)
      this.resetFilterCondition()

      const params = this.constructQueryParams()
      this.$emit('refresh', params, this.reload)
      if (!this.reload) this.$emit('filter')
      this.$refs.filter.blur()
    },
    constructQueryParams() {
      const params = {}
      this.conditions.forEach((c) => {
        if(c.text) {
          const kv = c.text.split(':')
          params[c.value] = kv[1]
        }
      })
      return params
    },
    onFilterConditionBlur(){
      this.resetFilterCondition()
    },
    onFilterConditionFocus(){
      this.resetFilterCondition()
    },
    resetFilterCondition() {
      if (this.conditions === undefined) this.conditions = []
      const conditions = []
      this.conditions.forEach((c) => {
        if (c.text && c.text.indexOf(':') > -1) conditions.push(c)
      })
      this.conditions = conditions
      this.items = deepCopy(this.filters)
      this.filterText = ''
    },
  },
}
</script>
