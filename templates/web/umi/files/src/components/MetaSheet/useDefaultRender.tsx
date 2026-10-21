import type { ButtonType } from 'antd/es/button'
import type { ALIGN } from './constant'
import { Button, Row, Space } from 'antd'
import { useCallback } from 'react'
import { checkButtonType, checkCustomerOption } from './helper'

export interface OptionButtonType {
  label: string
  type?: ButtonType
  align?: ALIGN
  className?: string
  /**
   * 是否仅在选中row时启用
   */
  onlyRow?: boolean
  /**
   * 是否禁用，这个优先级最高
   * @param selectedRowKeys
   * @param selectedRows
   * @returns
   */
  disabled?: (selectedRowKeys: React.Key[], selectedRows?: any[]) => boolean
  /**
   * 新增了refresh函数,会重新请求table数据，重置rowSelection状态
   * 但是一般来说handler会比较复杂，实际用起来还得传递refresh，还是使用ref更灵活
   * @param selectedRowKeys
   * @param selectedRows
   * @param refresh
   * @returns
   */
  handler: (
    selectedRowKeys: React.Key[],
    selectedRows: any[],
    refresh: () => any,
  ) => any
}

export interface CustomerOption {
  align?: ALIGN
  node: React.ReactNode
}

export type OptionsTypes = OptionButtonType | CustomerOption

export interface OptionRenderParams {
  selectedRowKeys: React.Key[]
  selectedRows: any[]
  refreshSheet: () => void
  hasSelected: boolean
  options: OptionsTypes[]
}

export function useDefaultRender() {
  // 操作模块渲染
  const defaultOptionRender = useCallback(
    ({
      hasSelected,
      options,
      refreshSheet,
      selectedRowKeys,
      selectedRows,
    }: OptionRenderParams) => {
      if (!options || options.length === 0)
        return null
      return (
        <Row style={{ margin: '5px 0 8px 0' }}>
          <Space>
            {options.map((option) => {
              // 自定义结点, 不绑定handler与rowDisable
              // 类型断言
              if (checkCustomerOption(option))
                return option.node
              if (checkButtonType(option)) {
                return (
                  <Button
                    className={option.className}
                    disabled={
                      option?.disabled
                        ? option.disabled(selectedRowKeys, selectedRows)
                        : option?.onlyRow === false
                          ? false
                          : !hasSelected
                    }
                    key={option.label}
                    onClick={() =>
                      option.handler(
                        selectedRowKeys,
                        selectedRows,
                        refreshSheet,
                      )}
                    type={option.type}
                  >
                    {option.label}
                  </Button>
                )
              }
              return undefined
            })}
          </Space>
        </Row>
      )
    },
    [],
  )

  return {
    defaultOptionRender,
  }
}
