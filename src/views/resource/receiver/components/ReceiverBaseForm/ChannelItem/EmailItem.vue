<template>
  <v-list-item two-line>
    <v-list-item-content class="py-2">
      <v-list-item-subtitle class="text-body-2 py-0">
        <v-list-item
          two-line
          class="float-left py-0 pl-0"
          style="width: 300px;"
        >
          <v-list-item-content class="py-0">
            <v-list-item-title class="text-subtitle-2 py-1 primary--text">
              发件人
            </v-list-item-title>
            <v-list-item-subtitle class="text-body-2 py-1">
              {{ item.from }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list-item-subtitle>
      <v-list-item-subtitle class="text-body-2 py-0">
        <v-list-item
          two-line
          class="float-left py-0 pl-0"
        >
          <v-list-item-content class="py-0">
            <v-list-item-title class="text-subtitle-2 py-1 primary--text">
              收件人
            </v-list-item-title>
            <v-list-item-subtitle class="text-body-2 py-1 white-space">
              {{ item.to }}
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
      @click="updateConfig(item.type, item.index)"
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
      @click="removeConfig(item.type, item.index)"
    >
      <v-icon>mdi-delete</v-icon>
    </v-btn>
  </v-list-item>
</template>

<script>
export default {
  name: 'EmailItem',
  props: {
    item: {
      type: Object,
      default: () => null,
    },
  },
  methods: {
    updateConfig(type, index) {
      this.$emit('updateConfig', type, index)
    },
    removeConfig(type, index) {
      this.$emit('removeConfig', type, index)
    },
  },
}
</script>

<style lang="scss" scoped>
.white-space {
  white-space: normal;
}
</style>
>
