<template>
  <v-card class="my-3">
    <BaseSubTitle
      title="事件"
      :divider="false"
    >
      <template #selector>
        <v-sheet class="text-body-2 text--darken-1">
          集群
          <v-menu
            v-model="eventMenu"
            bottom
            left
            offset-y
            origin="top center"
            transition="scale-transition"
            nudge-bottom="5px"
          >
            <template #activator="{ on }">
              <v-btn
                depressed
                color="white"
                class="primary--text font-weight-medium"
                small
                dark
                v-on="on"
                @click="m_select_clusterSelectData(Tenant().ID)"
              >
                {{ clusterName }}
                <v-icon
                  v-if="eventMenu"
                  right
                >
                  fas fa-angle-up
                </v-icon>
                <v-icon
                  v-else
                  right
                >
                  fas fa-angle-down
                </v-icon>
              </v-btn>
            </template>
            <v-data-iterator
              :items="[{ text: '集群', values: m_select_clusterItems }]"
              hide-default-footer
            >
              <template #no-data>
                <v-card>
                  <v-card-text> 暂无集群 </v-card-text>
                </v-card>
              </template>
              <template #default="props">
                <v-card
                  v-for="item in props.items"
                  :key="item.text"
                >
                  <v-list dense>
                    <v-flex class="text-subtitle-2 text-center ma-2">
                      <span>集群</span>
                    </v-flex>
                    <v-divider class="mx-2" />
                    <v-list-item
                      v-for="(cluster, index) in item.values"
                      :key="index"
                      class="text-body-2 text-center font-weight-medium"
                      link
                      :style="
                        cluster.text === clusterName
                          ? `color: #1e88e5 !important;`
                          : ``
                      "
                      @click="setCluster(cluster)"
                    >
                      <v-list-item-content>
                        <span>{{ cluster.text }}</span>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list>
                </v-card>
              </template>
            </v-data-iterator>
          </v-menu>
        </v-sheet>
      </template>
      <template #action>
        <v-btn
          small
          text
          color="primary"
          class="float-right mr-2"
          @click="toEvent"
        >
          <v-icon
            left
            small
          >
            mdi-more
          </v-icon>
          更多
        </v-btn>
      </template>
    </BaseSubTitle>
    <v-card-text>
      <v-flex
        v-if="eventItems.length === 0"
        class="text-subtitle-2 text-center"
      >
        暂无数据
      </v-flex>
      <div class="align-items-center">
        <div class="vs-scrollable">
          <div
            v-for="(item, index) in eventItems"
            :key="index"
            class="comment-widgets position-relative"
          >
            <div class="d-flex flex-row comment-row mt-0 py-1">
              <div class="pa-2">
                <v-badge
                  v-if="item.stream.count > 1"
                  bordered
                  :color="$EVENT_STATUS_COLOR[item.stream.type]"
                  :content="
                    item.stream.count >= 100 ? '99+' : item.stream.count
                  "
                  overlap
                >
                  <v-avatar
                    :color="$EVENT_STATUS_COLOR[item.stream.type]"
                    size="45"
                  >
                    <span class="white--text text-h6">
                      {{ item.stream.type[0].toLocaleUpperCase() }}
                    </span>
                  </v-avatar>
                </v-badge>
                <v-avatar
                  v-else
                  :color="$EVENT_STATUS_COLOR[item.stream.type]"
                  size="45"
                >
                  <span class="white--text text-h6">{{
                    item.stream.type[0].toLocaleUpperCase()
                  }}</span>
                </v-avatar>
              </div>
              <div class="comment-text pl-5">
                <h3 class="font-weight-regular mb-2">
                  {{ item.stream.reason }}
                </h3>
                <span
                  :class="`d-block my-0 text-subtitle-2 font-weight-regular kubegems__break-all ${messageClass[index]}`"
                  @mouseover="$set(messageClass, index, 'event--show')"
                  @mouseout="$set(messageClass, index, 'event--collapse')"
                >
                  {{ item.stream.message }}
                </span>
                <div class="comment-footer">
                  <span class="text-muted mr-2">
                    {{
                      item.stream.lastTimestamp
                        ? $moment(
                          item.stream.lastTimestamp,
                          'YYYY-MM-DDTHH:mm:ssZ',
                        ).fromNow()
                        : item.stream.eventTime
                          ? $moment(
                            item.stream.eventTime,
                            'YYYY-MM-DDTHH:mm:ssZ',
                          ).fromNow()
                          : ''
                    }}
                  </span>

                  <v-chip
                    class="mx-1 white--text component-chip"
                    color="grey"
                    x-small
                    label
                  >
                    <v-icon
                      left
                      x-small
                    >
                      mdi-label
                    </v-icon>
                    {{ item.stream.source_component }}
                  </v-chip>
                </div>
              </div>
            </div>
            <v-divider class="mb-2 mt-2" />
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { getEventListFromLoki } from '@/api'
import BaseSelect from '@/mixins/select'
import BaseResource from '@/mixins/resource'

export default {
  name: 'EventList',
  mixins: [BaseSelect, BaseResource],
  data: () => ({
    eventItems: [],
    clusterName: '',
    messageClass: ['event--collapse', 'event--collapse', 'event--collapse', 'event--collapse', 'event--collapse'],
    eventMenu: false,
  }),
  computed: {
    ...mapState(['JWT', 'Admin']),
    ...mapGetters(['Tenant']),
  },
  async mounted() {
    if (this.JWT) {
      if (this.Tenant().ID > 0) {
        await this.m_select_clusterSelectData(this.Tenant().ID)
        if (this.m_select_clusterItems.length > 0) {
          this.clusterName = this.m_select_clusterItems[0].text
          this.eventList()
        }
      }
    }
  },
  methods: {
    async eventList() {
      let query = '{container="gems-eventer"} | json | __error__=``'
      await this.m_select_environmentSelectData(this.Tenant().ID)
      const ns = []
      if (this.m_select_environmentItems.length > 0) {
        this.m_select_environmentItems.forEach((e) => {
          ns.push(`^${e.value}$`)
        })
        query += ` | line_format "{{.metadata_namespace}}" |~ "${ns.join('|')}"`
      } else return
      const data = await getEventListFromLoki(this.clusterName, {
        query: query,
        limit: 5,
        start:
          Date.parse(
            this.$moment(
              new Date(new Date().setHours(new Date().getHours() - 24)),
            ).utc(),
          ) + '000000',
        end: Date.parse(this.$moment(new Date()).utc()) + '000000',
        noprocessing: true,
      })
      this.eventItems = data || []
    },
    setCluster(cluster) {
      if (cluster.text !== this.clusterName) {
        this.clusterName = cluster.text
        this.eventList()
      }
    },
    toEvent() {
      this.$router.push({
        name: 'event-list',
        params: {
          tenant: this.Tenant().TenantName,
        },
        query: {
          clustername: this.clusterName,
          tenant: this.Tenant().TenantName,
        },
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.event--collapse {
  min-height: 22px;
  max-height: 43px;
  overflow: hidden;
}
.event--show {
  min-height: 22px;
  height: auto;
  overflow: auto;
}
.component-chip {
  max-width: 250px;
  word-break: break-all;
  white-space: initial;
  height: auto;
}
</style>
