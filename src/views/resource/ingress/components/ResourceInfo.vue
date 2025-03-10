<template>
  <v-sheet>
    <v-sheet class="pa-2">
      <BaseListItemForDetail title="网关">
        <template #content>
          {{ gateway ? gateway.metadata.name : '' }}
        </template>
      </BaseListItemForDetail>

      <BaseListItemForDetail title="generation">
        <template #content>
          {{ ingress ? ingress.metadata.generation : '' }}
        </template>
      </BaseListItemForDetail>
    </v-sheet>

    <BaseDivider />

    <BaseSubTitle
      title="路由规则"
      :divider="false"
      class="mt-2 pl-4"
    />
    <v-flex class="pl-4 kubegems__detail py-2 text-subtitle-1">HTTP</v-flex>
    <v-data-table
      class="mx-2 pa-2 no-header-table"
      :headers="[
        { text: 'http', value: 'http', align: 'start' },
        { text: 'opp', value: 'opp', align: 'end' },
        { text: '', value: 'data-table-expand', align: 'end' },
      ]"
      :items="
        ingress
          ? ingress.spec.rules.filter((item) => {
            return getHost(item, ingress) === 'http'
          })
          : []
      "
      no-data-text="暂无数据"
      hide-default-footer
      hide-default-header
      single-expand
      show-expand
      item-key="host"
      @click:row="onHttpRowClick"
    >
      <template #[`item.http`]="{ item }">
        <v-flex
          v-for="(path, i) in item.http.paths"
          :key="i"
        >
          http://{{ item.host }}{{ getGatewayPort('http') }}{{ path.path }}
        </v-flex>
      </template>
      <template #[`item.opp`]="{ item }">
        <v-flex
          v-for="(path, i) in item.http.paths"
          :key="i"
        >
          <v-btn
            x-small
            text
            color="primary"
            @click.stop="toAddress(item, ingress, path.path)"
          >
            访问
          </v-btn>
        </v-flex>
      </template>
      <template #expanded-item="{ headers, item }">
        <td
          :colspan="headers.length"
          class="text-left"
        >
          <v-chip
            v-for="(path, i) in item.http.paths"
            :key="i"
            color="success"
            text-color="white"
            class="mx-1 font-weight-medium"
            small
          >
            {{ path.backend.serviceName }}｜{{ path.backend.servicePort }}
          </v-chip>
        </td>
      </template>
    </v-data-table>

    <v-flex class="pl-4 kubegems__detail py-2 text-subtitle-1">HTTPS</v-flex>
    <v-data-table
      class="mx-2 pa-2 no-header-table"
      :headers="[
        { text: 'https', value: 'https', align: 'start' },
        { text: 'opp', value: 'opp', align: 'end' },
        {
          text: '',
          value: 'data-table-expand',
          align: 'end',
        },
      ]"
      :items="
        ingress
          ? ingress.spec.rules.filter((item) => {
            return getHost(item, ingress) === 'https'
          })
          : []
      "
      no-data-text="暂无数据"
      hide-default-footer
      hide-default-header
      single-expand
      show-expand
      item-key="host"
      @click:row="onHttpsRowClick"
    >
      <template #[`item.https`]="{ item }">
        <v-flex
          v-for="(path, i) in item.http.paths"
          :key="i"
        >
          https://{{ item.host }}{{ getGatewayPort('https') }}{{ path.path }}
        </v-flex>
      </template>
      <template #[`item.opp`]="{ item }">
        <v-flex
          v-for="(path, i) in item.http.paths"
          :key="i"
        >
          <v-btn
            x-small
            text
            color="primary"
            @click.stop="toAddress(item, ingress, path.path)"
          >
            访问
          </v-btn>
        </v-flex>
      </template>
      <template #expanded-item="{ headers, item }">
        <td
          :colspan="headers.length"
          class="text-left"
        >
          <v-chip
            v-for="(path, i) in item.http.paths"
            :key="i"
            color="success"
            text-color="white"
            class="mx-1 font-weight-medium"
            small
          >
            {{ path.backend.serviceName }}｜{{ path.backend.servicePort }}
          </v-chip>
        </td>
      </template>
    </v-data-table>
  </v-sheet>
</template>

<script>
import BaseResource from '@/mixins/resource'
import { deepCopy } from '@/utils/helpers'

export default {
  name: 'ResourceInfo',
  mixins: [BaseResource],
  props: {
    item: {
      type: Object,
      default: () => null,
    },
    gateway: {
      type: Object,
      default: () => null,
    },
  },
  data() {
    return {
      ingress: null,
    }
  },
  watch: {
    item() {
      this.ingress = deepCopy(this.item)
    },
  },
  mounted() {
    if (this.item) this.ingress = deepCopy(this.item)
  },
  methods: {
    getHost(rule, item) {
      let prefix = 'http'
      if (item.spec.tls) {
        item.spec.tls.forEach((t) => {
          const i = t.hosts.findIndex((h) => {
            return h === rule.host
          })
          if (i > -1) {
            prefix = 'https'
            return
          }
        })
      }
      return prefix
    },
    getGatewayPort(type) {
      if (this.gateway && this.gateway.status) {
        if (type === 'http') {
          const g = this.gateway.status.ports.find((g) => {
            return g.name === 'http2'
          })
          if (g) return `:${g.nodePort}`
          return ''
        } else if (type === 'https') {
          const g = this.gateway.status.ports.find((g) => {
            return g.name === 'https'
          })
          if (g) return `:${g.nodePort}`
          return ''
        }
      }
      return ''
    },
    toAddress(rule, item, path) {
      const prefix = this.getHost(rule, item)
      if (this.gateway) {
        const port = this.getGatewayPort(prefix)
        window.open(`${prefix}://${rule.host}${port}${path}`)
      } else {
        this.$store.commit('SET_SNACKBAR', {
          text: `找不到对应网关`,
          color: 'warning',
        })
      }
    },
    onHttpRowClick(item, { expand, isExpanded }) {
      expand(!isExpanded)
    },
    onHttpsRowClick(item, { expand, isExpanded }) {
      expand(!isExpanded)
    },
  },
}
</script>

<style lang="scss">
.no-header-table .text-end {
  width: 50px !important;
}
</style>
