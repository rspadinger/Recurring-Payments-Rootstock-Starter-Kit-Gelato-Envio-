import { ChevronDown, ChevronUp } from "lucide-react"

type SortIconProps = {
    field: string
    sortField: string
    sortDirection: "asc" | "desc"
}

export const SortIcon = ({ field, sortField, sortDirection }: SortIconProps) => {
    if (field !== sortField) return <ChevronDown className="h-4 w-4 opacity-50" />
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
}
