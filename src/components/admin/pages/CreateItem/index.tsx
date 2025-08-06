import React, { useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import {
  UploadCloud,
  FilePlus,
  PlusCircle,
  Check,
  X,
  ImageIcon,
} from "lucide-react";
import { UrlProducts, UrlCategories } from "../../utils/scripts/url/index"; // ajuste o caminho
import Navbar from "../../utils/Navbar";
import { DisabledVisible } from "@mui/icons-material";

export default function CreateItemWithCategory() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [categories, setCategories] = useState([]); // lista de categorias
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(""); // id selecionado

  const fileRef = useRef(null);

  // ----- categorias -----
  async function fetchCategories() {
    setCategoriesLoading(true);
    try {
      const res = await fetch(UrlCategories.allCategories);
      if (!res.ok) {
        throw new Error(`Erro ${res.status}`);
      }
      const data = await res.json();
      // espera-se array de { id, name } - ajuste se necessário
      setCategories(Array.isArray(data) ? data : []);
      // se não houver seleção e houver categorias, escolhe a primeira
      if (Array.isArray(data) && data.length > 0 && !selectedCategory) {
        setSelectedCategory(String(data[0].id ?? data[0].value ?? ""));
      }
    } catch (err) {
      console.error("Erro ao buscar categorias:", err);
      Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível carregar categorias." });
    } finally {
      setCategoriesLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- helpers upload -----
  function handleFileSelect(f) {
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }
  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }
  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFileSelect(f);
  }

  // ----- criar categoria via SweetAlert e atualizar lista -----
  async function handleCreateCategory() {
    const { value: categoryName } = await Swal.fire({
      title: "Criar nova categoria",
      input: "text",
      inputLabel: "Nome da categoria",
      inputPlaceholder: "Ex: Climatizadores",
      showCancelButton: true,
      confirmButtonText: "Criar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (!value || !value.trim()) return "Digite um nome válido";
        return null;
      },
      customClass: { popup: "rounded-md" },
    });

    if (!categoryName) return;

    try {
      Swal.fire({ title: "Criando categoria...", didOpen: () => Swal.showLoading() });

      const res = await fetch(UrlCategories.createCategory, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName.trim() }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Erro ${res.status}`);
      }

      const created = await res.json();
      Swal.fire({ icon: "success", title: "Categoria criada", text: `"${categoryName}" criada.` });

      // Recarrega categorias e seleciona a criada (assumindo que a API retorne o objeto criado)
      await fetchCategories();

      // tenta selecionar a nova categoria caso a API retorne id
      const newId = created?.id ?? created?.ID ?? created?._id ?? null;
      if (newId) setSelectedCategory(String(newId));
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível criar a categoria." });
    }
  }

  // ----- enviar produto -----
  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);

    if (!title.trim() || !price.trim()) {
      Swal.fire({ icon: "warning", title: "Campos obrigatórios", text: "Título e preço são obrigatórios." });
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("price", price);
      formData.append("content", content);
      formData.append("published", published ? "true" : "false");

      // envia categoryId se selecionada
      if (selectedCategory) {
        formData.append("categoryId", selectedCategory); // ajuste se seu backend espera outro nome
      }

      if (file) formData.append("image", file);

      const res = await fetch(UrlProducts.createProduct, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Erro ${res.status}`);
      }

      await res.json();
      Swal.fire({ icon: "success", title: "Produto criado", text: "Produto criado com sucesso." });

      // limpar campos
      setTitle("");
      setPrice("");
      setContent("");
      setPublished(false);
      setFile(null);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Erro ao criar produto", text: "Verifique o console e o backend." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl bg-white rounded-2xl shadow-sm p-6 space-y-6"
        aria-label="Formulário para criar produto"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Criar novo produto</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateCategory}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
            >
              <PlusCircle size={18} /> Criar categoria
            </button>
          </div>
        </div>

        {/* Grid: left (form) / right (upload + preview) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Inputs */}
          <div className="md:col-span-2 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Título</span>
              <input
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Ar-condicionado portátil X200"
                required
              />
            </label>

            <div className="flex items-center gap-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Preço</span>
                <input
                  className="mt-1 block w-48 rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="R$ 0,00"
                  required
                />
              </label>

              {/* SELECT DE CATEGORIAS */}
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Categoria</span>
                <div className="mt-1">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="">— Selecione —</option>
                    {categoriesLoading ? (
                      <option disabled>Carregando...</option>
                    ) : (
                      categories.map((c) => (
                        <option key={c.id ?? c._id ?? c.value} value={c.id ?? c._id ?? c.value}>
                          {c.name ?? c.title ?? "Sem nome"}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Descrição</span>
              <textarea
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Detalhes do produto..."
              />
            </label>

            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="h-4 w-4 rounded text-blue-600"
                />
                <span className="text-sm text-gray-700">Publicar agora</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setTitle("");
                  setPrice("");
                  setContent("");
                  setPublished(false);
                  setFile(null);
                  setPreview(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="py-2 px-3 rounded-lg text-sm border border-gray-200 hover:bg-gray-50"
              >
                Limpar
              </button>
            </div>
          </div>

          {/* Right: Upload area & preview */}
          <div className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 ${
                dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white"
              } rounded-lg p-6 flex flex-col items-center justify-center text-center min-h-[180px] transition`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gray-100">
                  <UploadCloud size={28} className="text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Arraste e solte aqui</p>
                  <p className="text-sm text-gray-500">ou</p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <label
                  htmlFor="file"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white text-sm rounded-lg border border-gray-200 hover:shadow-sm cursor-pointer"
                >
                  <FilePlus size={16} /> <span>Importar arquivo</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    if (fileRef.current) fileRef.current.click();
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white text-sm rounded-lg border border-gray-200 hover:shadow-sm"
                >
                  <ImageIcon size={16} /> Escolher imagem
                </button>
              </div>

              <input
                ref={fileRef}
                id="file"
                type="file"
                accept="image/*"
                className="hidden"
                name="image"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  handleFileSelect(f);
                }}
              />
            </div>

            {/* preview and small info */}
            <div className="rounded-lg border border-gray-100 p-3 bg-gray-50">
              {preview ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={preview} alt="preview" className="w-full h-40 object-cover rounded-lg" />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        Swal.fire({
                          title: "Remover imagem?",
                          showCancelButton: true,
                          confirmButtonText: "Remover",
                        }).then((res) => {
                          if (res.isConfirmed) {
                            setFile(null);
                            setPreview(null);
                            if (fileRef.current) fileRef.current.value = "";
                            Swal.fire({ icon: "success", title: "Imagem removida" });
                          }
                        });
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-100"
                    >
                      <X size={14} /> Remover
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        Swal.fire({ icon: "info", title: "Preview", imageUrl: preview, imageAlt: "Preview" });
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-700 border border-green-100"
                    >
                      <Check size={14} /> Visualizar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600">Nenhuma imagem selecionada</div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow"
          >
            {isLoading ? "Salvando..." : "Salvar produto"}
          </button>
        </div>
      </form>
    </div>
    </>
  );
}
