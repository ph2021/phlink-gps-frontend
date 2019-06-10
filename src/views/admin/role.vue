<template>
  <div class="app-container">
    <!-- 查询和其他操作 -->
    <div class="filter-container" style="margin: 10px 0 10px 0;">
      <el-input
        v-model="keyword"
        clearable
        class="filter-item"
        style="width: 200px;"
        size="small"
        placeholder="请输入角色名称"
      />
      <el-button class="filter-item" size="mini" type="primary" icon="el-icon-search" @click="handleFind">查找
      </el-button>
      <el-button class="filter-item" size="mini" type="primary" icon="el-icon-plus" @click="handleAdd">添加角色</el-button>
    </div>

    <el-table :data="tableData" style="width: 100%" size="mini">

      <el-table-column type="selection" />
      <el-table-column label="序号" width="60" align="center">
        <template slot-scope="scope">
          <span>{{ scope.$index + 1 }}</span>
        </template>
      </el-table-column>

      <el-table-column label="角色名称" width="200" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.roleName }}</span>
        </template>
      </el-table-column>

      <el-table-column label="角色标识" width="200" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.roleCode }}</span>
        </template>
      </el-table-column>

      <el-table-column label="角色介绍" width="200" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.roleDesc }}</span>
        </template>
      </el-table-column>

      <el-table-column label="创建时间" width="160" align="center" prop="createTime">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" fixed="right" min-width="150" align="center">
        <template slot-scope="scope">
          <el-button size="mini" icon="el-icon-edit" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button type="danger" size="mini" icon="el-icon-delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加或修改对话框 -->
    <el-dialog :title="title" :visible.sync="dialogFormVisible">
      <el-form ref="form" :model="form" :rules="dataRule">

        <el-form-item label="角色名称" :label-width="formLabelWidth" prop="roleName">
          <el-input v-model="form.roleName" auto-complete="off" />
        </el-form-item>

        <el-form-item label="角色标识" :label-width="formLabelWidth" prop="roleCode">
          <el-input v-model="form.roleCode" auto-complete="off" />
        </el-form-item>

        <el-form-item label="角色介绍" :label-width="formLabelWidth" prop="roleDesc">
          <el-input v-model="form.roleDesc" auto-complete="off" />
        </el-form-item>

        <el-form-item label="数据范围" :label-width="formLabelWidth">
          <el-select v-model="form.dataScope" placeholder="请选择数据范围" @change="changeScope">
            <el-option
              v-for="item in dateScopes"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-if="form.dataScope === '自定义'" label="数据权限" :label-width="formLabelWidth">
          <popup-tree-input
            :data="deptData"
            :props="defaultProps"
            :prop="form.deptName"
            :node-key="''+form.deptId"
            :current-change-handle="deptTreeCurrentChangeHandle"
          />
        </el-form-item>

        <el-form-item label="访问菜单" :label-width="formLabelWidth">
          <el-tree
            ref="menuTree"
            v-loading="menuLoading"
            :data="menuData"
            size="mini"
            show-checkbox
            node-key="menuId"
            :props="defaultProps"
            element-loading-text="拼命加载中"
            :check-strictly="true"
            @check-change="handleMenuCheckChange"
          />

          <div style="padding-left:24px;padding-top:12px;">
            <el-checkbox v-model="checkAll" :disabled="false" @change="handleCheckAll"><b>全选</b></el-checkbox>
          </div>
        </el-form-item>

      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { getRoleList, addRole, updateRole, deleteRole, findRoleMenus } from '@/api/roles'
import { getMenus } from '@/api/menu'
import { parseTime } from '@/utils/index'
import { getDept } from '@/api/dept'
import PopupTreeInput from '@/components/PopupTreeInput'

import { formatData, getPar } from '@/utils/webUtils'

export default {
  components: {
    PopupTreeInput
  },
  data() {
    return {
      tableData: [],
      keyword: '',
      title: '',
      dialogFormVisible: false, // 控制弹出框
      formLabelWidth: '120px',
      isEditForm: false,
      dateScopes: ['全部', '本级', '自定义'],
      deptData: [],
      deptTreeProps: {
        label: 'name',
        children: 'children'
      },
      form: {
        roleId: 0,
        roleName: '',
        roleCode: '',
        roleDesc: '',
        roleMenus: [],
        dataScope: '',
        deptName: '',
        deptId: 1
      },
      // 分类菜单列表
      menuData: [],
      // tree配置项
      defaultProps: {
        children: 'children',
        label: 'name'
      },
      selectRole: {},
      checkAll: false,
      menuIds: [],
      // 表单校验
      dataRule: {
        roleName: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
        roleDesc: [{ required: true, message: '角色介绍不能为空', trigger: 'blur' }],
        roleCode: [{ required: true, message: '角色标识不能为空', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.findTreeData()
    this.roleList()
  },
  methods: {
    parseTime,
    // 获取角色
    roleList: function() {
      getRoleList().then(response => {
        if (response.data.code == 200) {
          this.tableData = response.data.data
        }
      })
    },
    // 获取数据
    findTreeData: function() {
      this.menuLoading = true
      getMenus().then((res) => {
        this.menuData = res.data.data
        this.menuLoading = false
      })
    },
    // 树节点选择监听
    handleMenuCheckChange(data, check, subCheck) {
      if (check) {
        // 节点选中时同步选中父节点
        const parentId = data.parentId
        this.$refs.menuTree.setChecked(parentId, true, false)
      } else {
        // 节点取消选中时同步取消选中子节点
        if (data.children != null) {
          data.children.forEach(element => {
            this.$refs.menuTree.setChecked(element.id, false, false)
          })
        }
      }
    },
    // 全选操作
    handleCheckAll() {
      if (this.checkAll) {
        const allMenus = []
        this.checkAllMenu(this.menuData, allMenus)
        this.$refs.menuTree.setCheckedNodes(allMenus)
      } else {
        this.$refs.menuTree.setCheckedNodes([])
      }
    },
    // 递归全选
    checkAllMenu(menuData, allMenus) {
      menuData.forEach(menu => {
        allMenus.push(menu)
        if (menu.children) {
          this.checkAllMenu(menu.children, allMenus)
        }
      })
    },

    handleFind: function() {
      this.roleList()
    },
    // 添加角色
    handleAdd: function() {
      this.dialogFormVisible = true
      this.title = '增加角色'
      this.form = {
        roleId: 0,
        roleName: '',
        roleCode: '',
        roleDesc: '',
        roleMenus: [],
        dataScope: '',
        deptName: '',
        deptId: 1
      }
      this.isEditForm = false
    },

    // 编辑角色
    handleEdit: function(row) {
      this.dialogFormVisible = true
      this.isEditForm = true
      this.title = '编辑角色'
      this.form = row
      this.handleRoleSelectChange(row.roleId)
    },

    // 角色选择改变监听
    handleRoleSelectChange(id) {
      this.selectRole.id = id
      const _this = this
      findRoleMenus(id).then((res) => {
        this.$refs.menuTree.setCheckedNodes(res.data.data)
        //   console.log(res.data.data)
        //   this.menuIds = []
        //   res.data.data.forEach(function(data, index) {
        //     let add = true
        //     // for (let i = 0; i < res.data.data.length; i++) {
        //     //   if (data.menuId === res.data.data[i].pid) {
        //     //     add = false
        //     //     break
        //     //   }
        //     // }
        //     if (add) {
        //       _this.menuIds.push(data.menuId)
        //     }
        //   })
      })
    },

    handleDelete: function(row) {
      const that = this
      this.$confirm('此操作将把角色删除, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          deleteRole(row.roleId).then(response => {
            if (response.data.code == 200) {
              this.$message({
                type: 'success',
                message: '操作成功'
              })
              that.roleList()
            } else {
              this.$message({
                type: 'error',
                message: response.data.msg
              })
            }
          })
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '已取消删除'
          })
        })
    },
    submitForm: function() {
      const roleId = this.selectRole.id > 0 ? this.selectRole.id : 0
      const checkedNodes = this.$refs.menuTree.getCheckedNodes(false, true)
      const roleMenus = []
      for (let i = 0, len = checkedNodes.length; i < len; i++) {
        const roleMenu = { roleId: roleId, menuId: checkedNodes[i].menuId }
        roleMenus.push(roleMenu)
      }
      // 得到选中树的角色id和菜单id
      this.form.roleMenus = roleMenus
      this.$refs['form'].validate((valid) => {
        if (valid) {
          if (this.isEditForm) {
            updateRole(this.form).then(response => {
              console.log(response)
              if (response.data.code == 200) {
                this.$message({
                  type: 'success',
                  message: '操作成功'
                })
                this.dialogFormVisible = false
                this.roleList()
              } else {
                this.$message({
                  type: 'error',
                  message: response.data
                })
              }
            })
          } else {
            addRole(this.form).then(response => {
              if (response.data.code == 200) {
                this.$message({
                  type: 'success',
                  message: '操作成功'
                })
                this.dialogFormVisible = false
                this.roleList()
              } else {
                this.$message({
                  type: 'error',
                  message: response.data.msg
                })
              }
            })
          }
        }
      })
    },
    // 时间格式化
    dateFormat: function(row, column, cellValue, index) {
      return format(row[column.property])
    },
    // 加载部门列表
    findDeptTree: function() {
      getDept().then((res) => {
        if (res.data.code == 200) {
          this.deptData = res.data.data
        }
      })
    },
    // 部门菜单树选中
    deptTreeCurrentChangeHandle(data, node) {
      this.form.deptId = data.deptId
      this.form.deptName = data.name
    },
    changeScope() {
      if (this.form.dataScope === '自定义') {
        this.findDeptTree()
      }
    }
  }
}
</script>