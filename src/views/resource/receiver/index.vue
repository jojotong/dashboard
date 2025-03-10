<template>
  <v-container fluid>
    <BaseViewportHeader />
    <BaseBreadcrumb :breadcrumb="breadcrumb" />
    <v-card>
      <v-card-title class="py-2">
        <BaseFilter
          :filters="filters"
          :default="{ items: [], text: '接收器名称', value: 'search' }"
          @refresh="filterList"
        />
        <NamespaceFilter />
        <v-spacer />
        <v-menu
          v-if="m_permisson_resourceAllow"
          left
        >
          <template #activator="{ on }">
            <v-btn icon>
              <v-icon
                small
                color="primary"
                v-on="on"
              >
                fas fa-ellipsis-v
              </v-icon>
            </v-btn>
          </template>
          <v-card>
            <v-card-text class="pa-2">
              <v-flex>
                <v-btn
                  text
                  color="primary"
                  @click="addReceiver"
                >
                  <v-icon left>mdi-plus-box</v-icon>
                  创建接收器
                </v-btn>
              </v-flex>
              <v-flex>
                <v-btn
                  text
                  color="error"
                  @click="
                    m_table_batchRemoveResource('接收器', 'Receiver', receiverList)
                  "
                >
                  <v-icon left>mdi-minus-box</v-icon>
                  删除接收器
                </v-btn>
              </v-flex>
            </v-card-text>
          </v-card>
        </v-menu>
      </v-card-title>
      <v-card-text>
        <v-data-table
          disable-sort
          :headers="headers"
          :items="items"
          :page.sync="page"
          :items-per-page="itemsPerPage"
          no-data-text="暂无数据"
          hide-default-footer
          show-select
          single-expand
          show-expand
          item-key="index"
          @page-count="pageCount = $event"
          @toggle-select-all="m_table_onResourceToggleSelect"
          @click:row="onRowClick"
        >
          <template #[`item.data-table-select`]="{ item, index }">
            <v-checkbox
              v-model="
                m_table_batchResources[
                  `${item.metadata.name}-${index + itemsPerPage * (page - 1)}`
                ].checked
              "
              color="primary"
              hide-details
              @click.stop
              @change="
                m_table_onResourceChange(
                  $event,
                  item,
                  `${index + itemsPerPage * (page - 1)}`,
                )
              "
            />
          </template>
          <template #[`item.member`]="{ item }">
            {{ item.member > 0 ? item.member : '' }}
          </template>
          <template #[`item.channel`]="{ item }">
            <span>{{ getChannel(item) }}</span>
          </template>
          <template #expanded-item="{ headers, item }">
            <td
              :colspan="headers.length"
              class="my-2 py-2"
            >
              <v-flex
                v-for="(webhook, index) in item.webhookConfigs"
                :key="`webhook${index}`"
                class="text-body-2 break-word my-1"
              >
                <div class="text-subtitle-2 kubegems__detail">
                  {{ `Webhook${index + 1}: ` }}
                </div>
                <a class="ml-2">{{ webhook.url }}</a>
              </v-flex>

              <v-flex
                v-for="(email, index) in item.emailConfigs"
                :key="`email${index}`"
                class="text-body-2 break-word my-1"
              >
                <div class="text-subtitle-2 kubegems__detail">
                  {{ `邮箱${index + 1}: ` }}
                </div>
                <v-flex class="ml-2">
                  <div>{{ `发件人:` }}{{ email.from }}</div>
                  <div>{{ `SMTP服务器:` }}{{ email.smtpServer }}</div>
                  <span>{{ `收件人:` }}</span>
                  <v-chip
                    v-for="(item, key) in email.to.split(',')"
                    :key="key"
                    class="mx-1"
                    small
                    color="success"
                  >
                    {{ item }}
                  </v-chip>
                </v-flex>
              </v-flex>
            </td>
          </template>
          <template #[`item.action`]="{ item }">
            <template v-if="item.name !== 'gemcloud-default-webhook'">
              <v-flex :id="`r${item.index}`" />
              <v-menu
                left
                :attach="`#r${item.index}`"
              >
                <template #activator="{ on }">
                  <v-btn icon>
                    <v-icon
                      x-small
                      color="primary"
                      v-on="on"
                    >
                      fas fa-ellipsis-v
                    </v-icon>
                  </v-btn>
                </template>
                <v-card>
                  <v-card-text class="pa-2">
                    <v-flex>
                      <v-btn
                        color="primary"
                        text
                        small
                        @click.stop="updateReceiver(item)"
                      >
                        编辑
                      </v-btn>
                    </v-flex>
                    <v-flex>
                      <v-btn
                        color="error"
                        text
                        small
                        @click.stop="removeReceiver(item)"
                      >
                        删除
                      </v-btn>
                    </v-flex>
                  </v-card-text>
                </v-card>
              </v-menu>
            </template>
          </template>
        </v-data-table>
        <BasePagination
          v-if="pageCount >= 1"
          v-model="page"
          :front-page="true"
          :page-count="pageCount"
          :size="itemsPerPage"
          @loaddata="receiverList"
          @changesize="onPageSizeChange"
          @changepage="onPageIndexChange"
        />
      </v-card-text>
    </v-card>
    <AddReceiver
      ref="addReceiver"
      @refresh="receiverList"
    />
    <UpdateReceiver
      ref="updateReceiver"
      @refresh="receiverList"
    />
  </v-container>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { getReceiverList, deleteReceiver } from '@/api'
import AddReceiver from './components/AddReceiver'
import UpdateReceiver from './components/UpdateReceiver'
import NamespaceFilter from '@/views/resource/components/common/NamespaceFilter'
import BaseFilter from '@/mixins/base_filter'
import BaseResource from '@/mixins/resource'
import BasePermission from '@/mixins/permission'
import BaseTable from '@/mixins/table'

export default {
  name: 'ReceiverList',
  components: {
    AddReceiver,
    UpdateReceiver,
    NamespaceFilter,
  },
  mixins: [BaseFilter, BaseResource, BasePermission, BaseTable],
  data: () => ({
    breadcrumb: {
      title: '接收器',
      tip: '接收器 (receivers) 是AlertManager中的接收者配置receivers。',
      icon: 'mdi-call-received',
    },
    filters: [{ text: '接收器名称', value: 'search', items: [] }],
    items: [],
    page: 1,
    pageCount: 0,
    itemsPerPage: 10,
    params: {},
  }),
  computed: {
    ...mapState(['JWT', 'AdminViewport']),
    ...mapGetters(['Environment']),
    headers() {
      const items = [
        { text: '名称', value: 'name', align: 'start' },
        { text: '渠道', value: 'channel', align: 'start' },
      ]
      if (this.m_permisson_resourceAllow) {
        items.push({ text: '', value: 'action', align: 'center', width: 20 })
      }
      if (this.AdminViewport) {
        items.splice(1, 0, {
          text: '命名空间',
          value: 'namespace',
          align: 'start',
        })
      }
      items.push({ text: '', value: 'data-table-expand' })
      return items
    },
  },
  watch: {
    '$store.state.NamespaceFilter': {
      handler: function (namespace) {
        if (namespace && !namespace.Mounted) {
          this.params.page = 1
          this.params.namespace = namespace.Namespace
          this.receiverList()
        }
      },
      deep: true,
    },
  },
  mounted() {
    if (this.JWT) {
      this.$nextTick(() => {
        if (this.ThisCluster === '') {
          this.$store.commit('SET_SNACKBAR', {
            text: `请创建或选择集群`,
            color: 'warning',
          })
          return
        }
        this.m_table_generateParams()
        this.receiverList()
      })
    }
  },
  methods: {
    async receiverList() {
      const data = await getReceiverList(
        this.ThisCluster,
        this.ThisNamespace,
        this.params,
      )
      this.items = data
      this.items = this.items.map((d, index) => {
        return {
          metadata: {
            name: d.name,
            namespace: d.namespace,
          },
          index: index,
          ...d,
        }
      })
      this.m_table_generateSelectResource()
    },
    filterList(params) {
      const defaultparams = {
        search: '',
      }
      for (const key in defaultparams) {
        if (params[key]) {
          defaultparams[key] = this.params[key]
        }
      }
      Object.assign(defaultparams, params)
      this.params = defaultparams
      this.$router.replace({ query: { ...this.$route.query, ...this.params } })
      this.receiverList()
    },
    addReceiver() {
      this.$refs.addReceiver.open()
    },
    updateReceiver(item) {
      this.$refs.updateReceiver.open()
      this.$refs.updateReceiver.init(item)
    },
    removeReceiver(item) {
      this.$store.commit('SET_CONFIRM', {
        title: `删除接收器`,
        content: {
          text: `删除接收器 ${item.name}`,
          type: 'delete',
          name: item.name,
        },
        param: { item },
        doFunc: async (param) => {
          await deleteReceiver(
            this.ThisCluster,
            param.item.namespace,
            param.item.name,
          )
          this.receiverList()
        },
      })
    },
    getChannel(item) {
      let counter = 0
      if (item.emailConfigs && item.emailConfigs.length > 0) {
        counter++
      }
      if (item.webhookConfigs && item.webhookConfigs.length > 0) {
        counter++
      }
      return counter
    },
    onPageSizeChange(size) {
      this.params.page = 1
      this.params.size = size
    },
    onPageIndexChange(page) {
      this.params.page = page
    },
    onRowClick(item, { expand, isExpanded }) {
      expand(!isExpanded)
    },
  },
}
</script>
