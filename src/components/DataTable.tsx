import { ReactNode } from 'react';
import { Edit2, Trash2 } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  customActions?: (row: T) => ReactNode;
}

export default function DataTable<T extends { id: string }>({ columns, data, onEdit, onDelete, customActions }: DataTableProps<T>) {
  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow-sm overflow-hidden border border-gray-100 sm:rounded-xl bg-white">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  {columns.map((col, i) => (
                    <th
                      key={i}
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {col.header}
                    </th>
                  ))}
                  {(onEdit || onDelete || customActions) && (
                    <th scope="col" className="relative px-6 py-4">
                      <span className="sr-only">Ações</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {data.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors group">
                    {columns.map((col, i) => (
                      <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {typeof col.accessor === 'function' ? col.accessor(row) : (row[col.accessor] as ReactNode)}
                      </td>
                    ))}
                    {(onEdit || onDelete || customActions) && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {customActions && customActions(row)}
                          {onEdit && (
                            <button
                              onClick={() => onEdit(row)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(row)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + (onEdit || onDelete || customActions ? 1 : 0)} className="px-6 py-8 text-center text-sm text-gray-500 bg-gray-50/30">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <span className="text-gray-400">Nenhum registro encontrado.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
