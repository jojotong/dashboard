<template>
  <v-card>
    <v-card-title class="text-h6 primary--text">
      {{ item ? item.name : '' }}
    </v-card-title>
    <v-list-item two-line>
      <v-list-item-content class="kubegems__detail">
        <v-list-item-title class="text-subtitle-2"> 项目 </v-list-item-title>
        <v-list-item-subtitle class="text-body-2">
          {{ item ? item.ProjectName : '' }}
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    <v-list-item
      v-if="ThisAppEnvironmentID"
      two-line
    >
      <v-list-item-content class="kubegems__detail">
        <v-list-item-title class="text-subtitle-2"> 环境 </v-list-item-title>
        <v-list-item-subtitle class="text-body-2">
          {{ Environment().EnvironmentName }}
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    <v-list-item two-line>
      <v-list-item-content class="kubegems__detail">
        <v-list-item-title class="text-subtitle-2">
          服务类型
        </v-list-item-title>
        <v-list-item-subtitle class="text-body-2">
          {{ item ? item.kind : '' }}
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    <v-list-item two-line>
      <v-list-item-content class="kubegems__detail">
        <v-list-item-title class="text-subtitle-2"> 标签 </v-list-item-title>
        <v-flex>
          <v-chip
            v-for="(value, key) in item ? item.labels : {}"
            :key="key"
            x-small
            class="ma-1 text-body-2"
            color="success"
            text-color="white"
          >
            <strong class="mx-1"> {{ key }} </strong>
            {{ value }}
          </v-chip>
        </v-flex>
      </v-list-item-content>
    </v-list-item>
    <v-list-item two-line>
      <v-list-item-content class="kubegems__detail">
        <v-list-item-title class="text-subtitle-2"> 创建人 </v-list-item-title>
        <v-list-item-subtitle class="text-body-2">
          {{ item ? item.creator : '' }}
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    <v-list-item two-line>
      <v-list-item-content class="kubegems__detail">
        <v-list-item-title class="text-subtitle-2">
          创建时间
        </v-list-item-title>
        <v-list-item-subtitle class="text-body-2">
          {{ item ? $moment(item.createAt).format('lll') : '' }}
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    <v-list-item two-line>
      <v-list-item-content class="kubegems__detail">
        <v-list-item-title class="text-subtitle-2"> 备注 </v-list-item-title>
        <v-list-item-subtitle class="text-body-2">
          {{ item ? item.description : '' }}
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
  </v-card>
</template>

<script>
import { mapGetters } from 'vuex'
import BaseResource from '@/mixins/resource'

export default {
  name: 'ResourceInfo',
  mixins: [BaseResource],
  props: {
    item: {
      type: Object,
      default: () => null,
    },
  },
  computed: {
    ...mapGetters(['Environment']),
  },
}
</script>
