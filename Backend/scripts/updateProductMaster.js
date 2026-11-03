const fs = require('fs');
let code = fs.readFileSync('Frontend/src/pages/office/ProductMaster.jsx', 'utf8');

// Replace fetchProducts and useEffect
const oldFetch = `  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await getOfficeProductsApi({
        search,
        category: selectedCategory,
        brand: selectedBrand,
        active: showInactive ? '' : 'true',
        limit: 150,
        offset: 0,
      });
      setProducts(res.products || []);
    } catch (err) {
      console.error(err);
      notify(err.message || 'Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedBrand, showInactive]);`;

const newFetch = `  const fetchProducts = async (currentSearch = search) => {
    try {
      setLoading(true);
      const res = await getOfficeProductsApi({
        search: currentSearch.trim(),
        category: selectedCategory,
        brand: selectedBrand,
        active: showInactive ? '' : 'true',
        limit: 150,
        offset: 0,
      });
      setProducts(res.products || []);
    } catch (err) {
      console.error(err);
      notify(err.message || 'Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Debounce search query so typing triggers server-side product search across all 10,000+ items
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedBrand, showInactive]);`;

const normalizedOld = oldFetch.replace(/\r\n/g, '\n');
const normalizedCode = code.replace(/\r\n/g, '\n');

if (normalizedCode.includes(normalizedOld)) {
  const isCRLF = code.includes('\r\n');
  const replaced = normalizedCode.replace(normalizedOld, newFetch.replace(/\r\n/g, '\n'));
  
  const oldDt = `      <DataTable
        tableId="product_master"
        title="Product Master"
        data={products}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search products by name, SKU, or brand..."`;

  const newDt = `      <DataTable
        tableId="product_master"
        title="Product Master"
        data={products}
        columns={columns}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        serverSide={true}
        searchPlaceholder="Search products by name, SKU, or brand..."`;

  const replacedFinal = replaced.replace(oldDt, newDt);
  fs.writeFileSync('Frontend/src/pages/office/ProductMaster.jsx', isCRLF ? replacedFinal.replace(/\n/g, '\r\n') : replacedFinal, 'utf8');
  console.log('Successfully updated ProductMaster.jsx');
} else {
  console.error('Could not find oldFetch block in ProductMaster.jsx');
}

