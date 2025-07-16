"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Upload, X, File, Image, FileText, Video } from "lucide-react"
import { Progress } from "./progress"

export interface UploadFile {
  id: string
  file: File
  progress: number
  status: "uploading" | "success" | "error"
  error?: string
  url?: string
}

export interface UploadProps extends React.HTMLAttributes<HTMLDivElement> {
  onFileSelect?: (files: File[]) => void
  onFileRemove?: (fileId: string) => void
  onFileUpload?: (file: File) => Promise<{ url: string } | { error: string }>
  acceptedFileTypes?: string[]
  maxFileSize?: number // in bytes
  maxFiles?: number
  disabled?: boolean
  multiple?: boolean
  value?: UploadFile[]
  variant?: "default" | "compact" | "button"
  showPreview?: boolean
}

const Upload = React.forwardRef<HTMLDivElement, UploadProps>(
  ({
    className,
    onFileSelect,
    onFileRemove,
    onFileUpload,
    acceptedFileTypes,
    maxFileSize = 10 * 1024 * 1024, // 10MB default
    maxFiles = 10,
    disabled = false,
    multiple = true,
    value = [],
    variant = "default",
    showPreview = true,
    children,
    ...props
  }, ref) => {
    const [isDragOver, setIsDragOver] = React.useState(false)
    const [files, setFiles] = React.useState<UploadFile[]>(value)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
      setFiles(value)
    }, [value])

    const handleDragOver = React.useCallback((e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled) {
        setIsDragOver(true)
      }
    }, [disabled])

    const handleDragLeave = React.useCallback((e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
    }, [])

    const validateFile = (file: File): string | null => {
      if (maxFileSize && file.size > maxFileSize) {
        return `File size must be less than ${(maxFileSize / (1024 * 1024)).toFixed(1)}MB`
      }

      if (acceptedFileTypes && acceptedFileTypes.length > 0) {
        const isValid = acceptedFileTypes.some(type => {
          if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase())
          }
          return file.type.match(type)
        })
        if (!isValid) {
          return `File type not supported. Accepted types: ${acceptedFileTypes.join(', ')}`
        }
      }

      return null
    }

    const processFiles = (fileList: FileList) => {
      const newFiles: File[] = []
      
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        if (files.length + newFiles.length >= maxFiles) {
          break
        }
        
        const error = validateFile(file)
        if (!error) {
          newFiles.push(file)
        }
      }

      if (newFiles.length > 0) {
        onFileSelect?.(newFiles)
        
        if (onFileUpload) {
          newFiles.forEach(async (file) => {
            const uploadFile: UploadFile = {
              id: Math.random().toString(36).substring(7),
              file,
              progress: 0,
              status: "uploading"
            }
            
            setFiles(prev => [...prev, uploadFile])
            
            try {
              const result = await onFileUpload(file)
              if ('url' in result) {
                setFiles(prev => prev.map(f => 
                  f.id === uploadFile.id 
                    ? { ...f, progress: 100, status: "success", url: result.url }
                    : f
                ))
              } else {
                setFiles(prev => prev.map(f => 
                  f.id === uploadFile.id 
                    ? { ...f, status: "error", error: result.error }
                    : f
                ))
              }
            } catch (error) {
              setFiles(prev => prev.map(f => 
                f.id === uploadFile.id 
                  ? { ...f, status: "error", error: "Upload failed" }
                  : f
              ))
            }
          })
        }
      }
    }

    const handleDrop = React.useCallback((e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      
      if (disabled) return
      
      const fileList = e.dataTransfer.files
      processFiles(fileList)
    }, [disabled, files.length, maxFiles, onFileSelect, onFileUpload])

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files
      if (fileList) {
        processFiles(fileList)
      }
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }

    const handleClick = () => {
      if (!disabled && fileInputRef.current) {
        fileInputRef.current.click()
      }
    }

    const handleRemoveFile = (fileId: string) => {
      setFiles(prev => prev.filter(f => f.id !== fileId))
      onFileRemove?.(fileId)
    }

    const getFileIcon = (file: File) => {
      const type = file.type.split('/')[0]
      switch (type) {
        case 'image':
          return <Image className="h-4 w-4" />
        case 'video':
          return <Video className="h-4 w-4" />
        default:
          if (file.type === 'application/pdf' || file.type.includes('text')) {
            return <FileText className="h-4 w-4" />
          }
          return <File className="h-4 w-4" />
      }
    }

    if (variant === "button") {
      return (
        <div ref={ref} className={cn("inline-flex", className)} {...props}>
          <button
            type="button"
            onClick={handleClick}
            disabled={disabled}
            className={cn(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
              "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
              "h-9 px-4 py-2"
            )}
          >
            <Upload className="h-4 w-4" />
            {children || "Upload Files"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={acceptedFileTypes?.join(',')}
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )
    }

    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={cn(
            "relative border-2 border-dashed rounded-lg transition-colors cursor-pointer",
            "flex flex-col items-center justify-center p-6 text-center",
            "hover:bg-accent/50",
            isDragOver && "border-primary bg-primary/5",
            disabled && "cursor-not-allowed opacity-50",
            variant === "compact" ? "p-4" : "p-6",
            !isDragOver && "border-border"
          )}
        >
          <Upload className={cn(
            "text-muted-foreground mb-2",
            variant === "compact" ? "h-6 w-6" : "h-8 w-8"
          )} />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {children || "Drop files here or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground">
              {acceptedFileTypes && acceptedFileTypes.length > 0 && (
                <>Supports: {acceptedFileTypes.join(', ')}<br /></>
              )}
              Max size: {(maxFileSize / (1024 * 1024)).toFixed(1)}MB
              {maxFiles > 1 && ` • Max ${maxFiles} files`}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={acceptedFileTypes?.join(',')}
            onChange={handleFileInput}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={disabled}
          />
        </div>

        {showPreview && files.length > 0 && (
          <div className="space-y-2">
            {files.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className="flex items-center gap-3 p-3 border rounded-lg bg-background"
              >
                <div className="flex-shrink-0">
                  {getFileIcon(uploadFile.file)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {uploadFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadFile.file.size / 1024).toFixed(1)} KB
                  </p>
                  {uploadFile.status === "uploading" && (
                    <Progress value={uploadFile.progress} className="mt-1 h-1" />
                  )}
                  {uploadFile.status === "error" && (
                    <p className="text-xs text-red-500 mt-1">
                      {uploadFile.error}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {uploadFile.status === "success" && (
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                  )}
                  {uploadFile.status === "error" && (
                    <div className="h-2 w-2 bg-red-500 rounded-full" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(uploadFile.id)}
                    className="text-muted-foreground hover:text-foreground p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)

Upload.displayName = "Upload"

export { Upload }