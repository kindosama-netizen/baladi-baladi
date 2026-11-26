export default function ImageField({ label, file, onFile, previewUrl }) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1">{label}</label>
      {previewUrl && !file && (
        <img src={previewUrl} alt="" className="h-24 w-24 object-cover rounded-xl mb-2 border" />
      )}
      {file && (
        <img src={URL.createObjectURL(file)} alt="" className="h-24 w-24 object-cover rounded-xl mb-2 border" />
      )}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onFile(e.target.files?.[0] || null)}
        className="block w-full text-sm"
      />
    </div>
  )
}
