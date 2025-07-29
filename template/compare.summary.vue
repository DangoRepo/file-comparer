<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>文件比对结果</title>
  <link rel="stylesheet" type="text/css" href="https://cdn.bootcdn.net/ajax/libs/element-ui/2.15.6/theme-chalk/index.css">
  <style type="text/css">
  #app {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    padding: .7rem;
  }
  .drawer-wrapper {
    padding: 0 1rem;
  }
  .form-component {
    width: 100%;
  }
  .action-wrapper {
    flex: none;
    margin-bottom: .7rem;
    display: flex;
    gap: .2rem;
    align-items: center;
  }
  .action-wrapper .wrapper {
    flex: auto;
  }
  .action-wrapper .summary {
    flex: none;
  }
  .table-wrapper {
    position: relative;
    flex: auto;
  }
  .table-component {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }
  </style>
</head>
<body>
  <div id="app">
    <!-- Popups -->
    <el-drawer
      :visible.sync="state.filterDrawerVisible"
      title="过滤筛选"
      direction="rtl"
      size="40%"
      :wrapperClosable="false"
      append-to-body
      modal-append-to-body>
      <el-form
        class="drawer-wrapper"
        size="mini"
        label-position="left"
        label-width="100px">
        <el-form-item label="差异类型">
          <el-select
            v-model="state.filterTypes"
            class="form-component"
            multiple>
            <el-option
              v-for="(item, i) in plugins.typeOptions"
              :key="i"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </el-drawer>

    <!-- Action Tools -->
    <div class="action-wrapper">
      <div class="wrapper">
        <el-button
          size="mini"
          type="info"
          icon="el-icon-search"
          circle
          @click="popupFilterDrawer">
        </el-button>
      </div>
      <div class="summary">
        <template v-for="(type, index) in plugins.typeOptions">
          {{type.label}}
          <el-tag type="primary">{{dataTypeCount[type.value] ?? 0}}</el-tag>
        </template>
      </div>
    </div>

    <!-- Table -->
    <div class="table-wrapper">
      <el-table
        class="table-component"
        :data="compareDataFiltered"
        size="mini"
        border
        height="auto"
        @sort-change="sortChange">
        <el-empty slot="empty" description="暂无数据"></el-empty>

        <el-table-column
          label="数字签名"
          sortable="custom"
          prop="hash">
          <template slot-scope="scope">
            {{scope.row.hash}}
          </template>
        </el-table-column>
        <el-table-column
          label="左侧文件名"
          sortable="custom"
          prop="lhs">
          <template slot-scope="scope">
            <template v-if="scope.row.lhs && scope.row.lhs.length > 0">
              <div v-for="(item, i) in scope.row.lhs" :key="i">
                {{item.filename}}
              </div>
            </template>
          </template>
        </el-table-column>
        <el-table-column
          width="100"
          align="center"
          sortable="custom"
          prop="type">
          <template slot-scope="scope">
            <el-button
              size="mini"
              :type="scope.row.typeOption.type"
              :icon="scope.row.typeOption.icon"
              circle>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column
          label="右侧文件名"
          sortable="custom"
          prop="rhs">
          <template slot-scope="scope">
            <template v-if="scope.row.rhs && scope.row.rhs.length > 0">
              <div v-for="(item, i) in scope.row.rhs" :key="i">
                {{item.filename}}
              </div>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>

  <script type="text/javascript" src="https://cdn.bootcdn.net/ajax/libs/vue/2.6.14/vue.min.js"></script>
  <script type="text/javascript" src="https://cdn.bootcdn.net/ajax/libs/element-ui/2.15.6/index.js"></script>
  <script type="text/javascript" src="https://cdn.bootcdn.net/ajax/libs/lodash.js/4.17.21/lodash.min.js"></script>
  <script type="text/javascript" src="https://unpkg.com/natural-compare-lite@1.4.0/index.js"></script>
  <script type="text/javascript">
  const initData = {{__ summary __}};
  new Vue({
    el: '#app',
    data() {
      return {
        compareDataSorted: [],
        state: {
          filterDrawerVisible: false,
          filterTypes: ['add', 'remove', 'same'],
        },
        plugins: {
          typeOptions: [
            {
              label: '新增',
              value: 'add',
              type: 'success',
              icon: 'el-icon-star-off'
            },
            {
              label: '删除',
              value: 'remove',
              type: 'danger',
              icon: 'el-icon-delete'
            },
            {
              label: '相同',
              value: 'same',
              type: 'info',
              icon: 'el-icon-more-outline'
            }
          ]
        }
      }
    },
    computed: {
      compareDataFiltered() {
        let list = this.compareDataSorted || [];
        list = this.applyTypeMapper(list);
        list = this.applyTypeFilter(list);

        return list;
      },
      dataTypeCount() {
        return _.reduce(initData, (res, val, key) => {
          res[val.type] = (res[val.type] ?? 0) + 1;
          return res;
        }, {});
      }
    },
    mounted() {
      this.compareDataSorted = _.cloneDeep(initData);
    },
    methods: {
      // popups / popdowns
      popupFilterDrawer() {
        this.state.filterDrawerVisible = true;
      },
      // Mappers
      applyTypeMapper(list = []) {
        let typeOptionMap = _.keyBy(this.plugins.typeOptions, 'value');
        let listMapped = _.map(list, v => {
          let typeKey = v.type || '';
          let typeOption = typeOptionMap[typeKey] || {};

          v.typeOption = typeOption;

          return v;
        });

        return listMapped;
      },
      applyTypeFilter(list = []) {
        let listFiltered = _.filter(list, v => this.state.filterTypes.indexOf(v.type) !== -1);

        return listFiltered;
      },
      // Sorter
      sortNatualCompare(a, b, order) {
        const compareRes = naturalCompare(a, b);
        switch(order) {
          case 'ascending':
            return compareRes;
          case 'descending':
            return -compareRes;
          default:
            return 0;
        }
      },
      sortStringCompare(a, b, order) {
        let compareRes = 0;
        if(a > b) {
          compareRes = -1;
        } else if(a < b) {
          compareRes = 1;
        }
        switch(order) {
          case 'ascending':
            return compareRes;
          case 'descending':
            return -compareRes;
          default:
            return 0;
        }
      },
      sortChange({ column, prop, order }) {
        const list = _.cloneDeep(initData);
        if(prop === 'lhs') {
          this.compareDataSorted = list.sort((a, b) => {
            const aName = _.get(a, 'lhs.0.filename', '');
            const bName = _.get(b, 'lhs.0.filename', '');
            return this.sortNatualCompare(aName, bName, order);
          });
        } else if(prop === 'rhs') {
          this.compareDataSorted = list.sort((a, b) => {
            const aName = _.get(a, 'rhs.0.filename', '');
            const bName = _.get(b, 'rhs.0.filename', '');
            return this.sortNatualCompare(aName, bName, order);
          });
        } else if(prop === 'type') {
          this.compareDataSorted = list.sort((a, b) => {
            const aType = _.get(a, 'type', '');
            const bType = _.get(b, 'type', '');
            return this.sortStringCompare(aType, bType, order);
          });
        } else if(prop === 'hash') {
          this.compareDataSorted = list.sort((a, b) => {
            const aHash = _.get(a, 'hash', '');
            const bHash = _.get(b, 'hash', '');
            return this.sortStringCompare(aHash, bHash, order);
          });
        }
      }
    }
  })
  </script>
</body>
</html>
