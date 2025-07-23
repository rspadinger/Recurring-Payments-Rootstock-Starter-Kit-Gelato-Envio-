//function cn that combines and merges CSS class names => used in all TailwindCSS projects
//Cleaner Code: You can pass conditional class names without manually resolving conflicts.
//Handles Conflicts: Automatically resolves conflicting TailwindCSS classes.

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge" //merge conflicting TailwindCSS classes (e.g., p-2 and p-4 → resolves to p-4

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
