import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, 
  MessageCircle, 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Filter, 
  X, 
  Check, 
  Send,
  Calendar,
  AlertCircle,
  Upload,
  Printer,
  FileDown,
  FileText,
  Settings,
  ImagePlus,
  Download,
  LayoutDashboard,
  TrendingUp,
  Activity,
  UserCheck,
  UserMinus,
  ClipboardList,
  LogOut,
  Lock,
  Mail
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithCustomToken, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

// ==========================================
// COMPONENTE DE LOGÓTIPO OFICIAL
// ==========================================
const ClinicLogo = ({ size = 40, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M25,20 C10,35 15,55 30,65 C40,70 35,85 25,95 C45,95 60,80 55,65 C50,50 65,40 75,30 C85,20 70,10 50,15 C40,17 35,10 25,20 Z" fill="currentColor"/>
    <path d="M60,45 Q80,35 90,40" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8"/>
    <path d="M65,55 Q85,45 95,50" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8"/>
    <path d="M70,65 Q90,55 100,60" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8"/>
  </svg>
);

// --- PROTEÇÃO DE ERROS ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error.toString() };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-200 max-w-lg w-full text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Erro no Sistema</h1>
            <p className="text-slate-600 mb-6">Ocorreu um problema técnico.</p>
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-left">
              <p className="text-xs font-bold text-red-800 mb-1">DETALHES DO ERRO:</p>
              <p className="text-sm font-mono text-red-600 break-words">{this.state.errorMsg}</p>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Firebase Setup
let app, auth, db;
try {
  const firebaseConfig = {
    apiKey: ['AIzaSyAqSA-', 'lIzEFJTh5wyqd41wCAx_rC4zPhHk'].join(''),
    authDomain: "odontosys-48fba.firebaseapp.com",
    projectId: "odontosys-48fba",
    storageBucket: "odontosys-48fba.firebasestorage.app",
    messagingSenderId: "729466626174",
    appId: "1:729466626174:web:3eb38672e10792658ab82f"
  };
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Erro ao inicializar Firebase:", error);
}

const TEMPLATES = {
  pendencia: "Olá {nome}, tudo bem? Notamos que há uma pendência financeira em seu prontuário. Por favor, entre em contato conosco para regularizarmos a situação. Obrigado!",
  agendamento: "Olá {nome}! Já faz um tempo desde a sua última consulta. Que tal agendarmos uma avaliação de retorno para manter seu sorriso em dia?",
  campanha: "Olá {nome}! [Sua mensagem personalizada aqui]"
};

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [patients, setPatients] = useState([]);
  
  const [clinicSettings, setClinicSettings] = useState({
    doctorName: 'Dr. Ricardo Bustamante Soria Jr.',
    cro: 'CROSP 44248',
    phone: '(15) 99758-6718',
    address: 'Rua Segundo Lopes Carmona, 135, Centro, Votorantim - SP',
    logo: ''
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);

  // CONEXÃO COM BANCO DE DADOS
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try {
          await signInWithCustomToken(auth, __initial_auth_token);
        } catch (e) {
          console.error("Erro ao usar token:", e);
        }
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    
    const patientsRef = collection(db, 'clinicas', user.uid, 'pacientes');
    const unsubscribePatients = onSnapshot(patientsRef, (snapshot) => {
      const patientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPatients(patientsData);
    }, (error) => {
      console.error("Erro de leitura:", error);
    });

    const settingsRef = doc(db, 'clinicas', user.uid, 'configuracoes', 'geral');
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setClinicSettings(docSnap.data());
      }
    });

    return () => {
      unsubscribePatients();
      unsubscribeSettings();
    };
  }, [user]);

  const addPatient = async (patient) => {
    if (!user || !db) return;
    try {
      const newId = Date.now().toString();
      const docRef = doc(db, 'clinicas', user.uid, 'pacientes', newId);
      await setDoc(docRef, patient);
    } catch (error) {
      alert(`Erro ao salvar: ${error.message}`);
    }
  };

  const updatePatient = async (updatedPatient) => {
    if (!user || !db) return;
    try {
      const dataToSave = { ...updatedPatient };
      delete dataToSave.id;
      const docRef = doc(db, 'clinicas', user.uid, 'pacientes', updatedPatient.id);
      await setDoc(docRef, dataToSave, { merge: true });
    } catch (error) {
      alert(`Erro ao atualizar: ${error.message}`);
    }
  };

  const deletePatient = async (id) => {
    if(window.confirm('Tem certeza que deseja excluir este paciente?')) {
      if (!user || !db) return;
      try {
        const docRef = doc(db, 'clinicas', user.uid, 'pacientes', id);
        await deleteDoc(docRef);
      } catch (error) {
        alert(`Erro ao apagar: ${error.message}`);
      }
    }
  };

  const handleImport = async (newPatients) => {
    if (!user || !db) return;
    try {
      for (const p of newPatients) {
         const dataToSave = { ...p };
         const newId = dataToSave.id || (Date.now().toString() + Math.random().toString(36).substr(2, 9));
         delete dataToSave.id;
         const docRef = doc(db, 'clinicas', user.uid, 'pacientes', newId);
         await setDoc(docRef, dataToSave);
      }
      alert("Planilha importada com sucesso!");
    } catch (error) {
      alert(`Erro na importação: ${error.message}`);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-6 font-sans text-center px-4">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin absolute inset-0 -m-3"></div>
          <ClinicLogo size={70} className="text-teal-600 animate-pulse" />
        </div>
        <div>
          <div className="text-teal-900 font-bold text-xl mb-1">OdontoSys</div>
          <div className="text-teal-600/70 text-sm">A carregar o seu consultório seguro...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen auth={auth} />;
  }

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col md:flex-row font-sans print:bg-white print:h-auto print:block overflow-hidden">
      
      {/* Sidebar - Atualizada com Logótipo */}
      <div className="w-full md:w-64 h-auto md:h-full shrink-0 bg-gradient-to-b from-teal-900 to-teal-800 text-white flex flex-col shadow-2xl print:hidden z-10 overflow-y-auto">
        <div className="p-6 flex items-center gap-3 shrink-0">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 text-white p-2 rounded-xl shadow-inner">
            <ClinicLogo size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">OdontoSys</h1>
        </div>
        <nav className="flex-1 px-4 pb-4 flex flex-col gap-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-white/15 font-semibold shadow-sm' : 'hover:bg-white/10'}`}>
            <LayoutDashboard size={20} /> Painel Geral
          </button>
          <button onClick={() => setActiveTab('pacientes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'pacientes' ? 'bg-white/15 font-semibold shadow-sm' : 'hover:bg-white/10'}`}>
            <Users size={20} /> Pacientes
          </button>
          <button onClick={() => setActiveTab('whatsapp')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'whatsapp' ? 'bg-white/15 font-semibold shadow-sm' : 'hover:bg-white/10'}`}>
            <MessageCircle size={20} /> WhatsApp & Campanhas
          </button>
          <button onClick={() => setActiveTab('documentos')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'documentos' ? 'bg-white/15 font-semibold shadow-sm' : 'hover:bg-white/10'}`}>
            <FileText size={20} /> Documentos e Receitas
          </button>
          <button onClick={() => setActiveTab('configuracoes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'configuracoes' ? 'bg-white/15 font-semibold shadow-sm' : 'hover:bg-white/10'}`}>
            <Settings size={20} /> Configurações
          </button>
          <div className="flex-1"></div>
          <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-red-200 hover:bg-red-500/20 hover:text-white mt-4 border border-red-400/20">
            <LogOut size={20} /> Sair do Sistema
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto print:overflow-visible relative">
        {activeTab === 'dashboard' && <DashboardView patients={patients} clinicSettings={clinicSettings} />}
        {activeTab === 'pacientes' && (
          <PatientsView 
            patients={patients} 
            onDelete={deletePatient}
            onEdit={(p) => { setEditingPatient(p); setIsModalOpen(true); }}
            onAddNew={() => { setEditingPatient(null); setIsModalOpen(true); }}
            onImport={handleImport}
          />
        )}
        {activeTab === 'whatsapp' && <WhatsAppView patients={patients} />}
        {activeTab === 'documentos' && <DocumentsView patients={patients} clinicSettings={clinicSettings} />}
        {activeTab === 'configuracoes' && <SettingsView clinicSettings={clinicSettings} db={db} user={user} />}
      </div>

      {isModalOpen && (
        <PatientModal 
          patient={editingPatient} 
          onClose={() => setIsModalOpen(false)} 
          onSave={(p) => {
            editingPatient ? updatePatient(p) : addPatient(p);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ==========================================
// PACIENTES VIEW
// ==========================================
function PatientsView({ patients, onDelete, onEdit, onAddNew, onImport }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlano, setFilterPlano] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef(null);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const nome = p.nome || '';
      const pasta = p.pasta || '';
      const matchName = nome.toLowerCase().includes(searchTerm.toLowerCase()) || pasta.includes(searchTerm);
      const matchStatus = filterStatus ? p.status === filterStatus : true;
      const matchPlano = filterPlano ? (p.plano || '').toLowerCase().includes(filterPlano.toLowerCase()) : true;
      return matchName && matchStatus && matchPlano;
    });
  }, [patients, searchTerm, filterStatus, filterPlano]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split(/\r?\n|\r/);
      if(lines.length > 1) {
        const separator = lines[0].includes(';') ? ';' : ',';
        const headers = lines[0].split(separator).map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
        const newPatients = [];
        for(let i = 1; i < lines.length; i++) {
          if(!lines[i].trim()) continue;
          const values = lines[i].split(separator).map(v => v.replace(/^"|"$/g, '').trim());
          let p = { id: Date.now().toString() + i, status: 'Ativo' };
          headers.forEach((h, index) => {
            let val = values[index];
            if (!val || val === '—' || val === '-') return;
            if(h.includes('pasta')) p.pasta = val;
            if(h.includes('nome')) p.nome = val;
            if(h.includes('celular')) p.celular = val;
            if(h.includes('whatsapp')) p.whatsapp = val;
            if(h.includes('status')) p.status = val;
            if(h.includes('nascimento')) {
              if (val.includes('/')) {
                const parts = val.split('/');
                if(parts.length === 3) p.nascimento = `${parts[2]}-${parts[1]}-${parts[0]}`;
              } else p.nascimento = val;
            }
            if(h.includes('cpf')) p.cpf = val;
            if(h.includes('ender')) p.endereco = val;
            if(h.includes('bairro')) p.bairro = val;
            if(h.includes('cidade')) p.cidade = val;
            if(h.includes('email')) p.email = val;
            if(h.includes('profis')) p.profissao = val;
            if(h.includes('plano')) p.plano = val;
            if(h.includes('obs')) p.obs = val;
          });
          if(p.nome) newPatients.push(p);
        }
        if (newPatients.length > 0) onImport(newPatients);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleExportCSV = () => {
    if (patients.length === 0) return;
    const headers = ['Pasta', 'Nome', 'Celular', 'Status', 'Plano', 'CPF', 'Email'];
    const csvRows = patients.map(p => [p.pasta, p.nome, p.celular, p.status, p.plano, p.cpf, p.email].map(v => `"${v||''}"`).join(';'));
    const blob = new Blob([[headers.join(';'), ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `backup_pacientes.csv`);
    link.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 print:p-0 print:space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gerenciamento de Pacientes</h2>
          <p className="text-slate-500 print:hidden">Cadastro e Controle Clínico</p>
        </div>
        <div className="flex flex-wrap gap-3 print:hidden">
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button onClick={handleExportCSV} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"><Download size={20} /> Backup</button>
          <button onClick={() => fileInputRef.current.click()} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"><Upload size={20} /> Importar</button>
          <button onClick={onAddNew} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"><Plus size={20} /> Novo Paciente</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 print:hidden">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="Buscar por Nome ou nº da Pasta..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"><Filter size={20} /> Filtros</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-sm uppercase text-slate-600">
              <tr>
                <th className="p-4 font-medium">Pasta</th>
                <th className="p-4 font-medium">Nome</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Plano</th>
                <th className="p-4 font-medium text-right print:hidden">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-teal-800">{p.pasta || '-'}</td>
                  <td className="p-4 text-slate-800 font-medium">{p.nome}</td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full 
                      ${p.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">{p.plano}</td>
                  <td className="p-4 flex items-center justify-end gap-2 print:hidden">
                    <button onClick={() => onEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={18} /></button>
                    <button onClick={() => onDelete(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// DASHBOARD VIEW
// ==========================================
function DashboardView({ patients, clinicSettings }) {
  const stats = useMemo(() => ({
    total: patients.length,
    tratamento: patients.filter(p => p.status === 'Em Tratamento').length,
    aberto: patients.filter(p => p.status === 'Em aberto').length,
    pendencias: patients.filter(p => p.status === 'Em Pendências').length,
    ativos: patients.filter(p => p.status === 'Ativo').length
  }), [patients]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <ClinicLogo size={48} className="text-teal-700 hidden md:block" />
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Painel Geral</h2>
          <p className="text-slate-500">{clinicSettings.doctorName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3">
          <div className="flex items-center gap-3 text-blue-600"><Users size={20} /><p className="text-sm font-medium text-slate-500">Total Pacientes</p></div>
          <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3">
          <div className="flex items-center gap-3 text-teal-600"><Activity size={20} /><p className="text-sm font-medium text-slate-500">Tratamentos</p></div>
          <p className="text-3xl font-bold text-slate-800">{stats.tratamento}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3">
          <div className="flex items-center gap-3 text-orange-600"><ClipboardList size={20} /><p className="text-sm font-medium text-slate-500">Orçamentos</p></div>
          <p className="text-3xl font-bold text-slate-800">{stats.aberto}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3">
          <div className="flex items-center gap-3 text-red-600"><AlertCircle size={20} /><p className="text-sm font-medium text-slate-500">Pendências</p></div>
          <p className="text-3xl font-bold text-slate-800">{stats.pendencias}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3">
          <div className="flex items-center gap-3 text-green-600"><UserCheck size={20} /><p className="text-sm font-medium text-slate-500">Ativos</p></div>
          <p className="text-3xl font-bold text-slate-800">{stats.ativos}</p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// WHATSAPP VIEW
// ==========================================
function WhatsAppView({ patients }) {
  const [targetStatus, setTargetStatus] = useState('');
  const [customMessage, setCustomMessage] = useState(TEMPLATES.pendencia);
  const [sentLog, setSentLog] = useState({});

  const targetedPatients = useMemo(() => targetStatus ? patients.filter(p => p.status === targetStatus) : patients, [patients, targetStatus]);

  const generateWhatsAppLink = (p) => {
    const msg = customMessage.replace(/{nome}/g, (p.nome || '').split(' ')[0]);
    const phone = (p.whatsapp || p.celular || '').replace(/\D/g, '');
    if(!phone) return null;
    return `https://wa.me/${phone.startsWith('55') ? phone : `55${phone}`}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Campanhas WhatsApp</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 h-fit space-y-4">
          <label className="block text-sm font-medium text-slate-700">Público-Alvo (Status)</label>
          <select className="w-full p-2 border border-slate-300 rounded-lg outline-none" value={targetStatus} onChange={(e) => setTargetStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="Ativo">Ativo</option>
            <option value="Em Tratamento">Em Tratamento</option>
            <option value="Em aberto">Em aberto</option>
            <option value="Em Pendências">Em Pendências</option>
          </select>
          <label className="block text-sm font-medium text-slate-700">Mensagem</label>
          <textarea rows="5" className="w-full p-3 border border-slate-300 rounded-lg outline-none text-sm resize-none" value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} />
          <p className="text-xs text-slate-400">Dica: Use {'{nome}'} para o primeiro nome do paciente.</p>
        </div>
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 h-fit space-y-3">
          {targetedPatients.map(p => {
            const link = generateWhatsAppLink(p);
            return (
              <div key={p.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50">
                <div><p className="font-medium text-slate-800">{p.nome}</p><p className="text-sm text-slate-500">{p.whatsapp || p.celular}</p></div>
                {link && <a href={link} target="_blank" rel="noopener" onClick={() => setSentLog(prev => ({...prev, [p.id]: true}))} className={`px-4 py-2 rounded-lg text-sm font-medium ${sentLog[p.id] ? 'bg-slate-100 text-slate-500' : 'bg-[#25D366] text-white hover:bg-[#20bd5a]'}`}>{sentLog[p.id] ? 'Enviado' : 'Enviar WhatsApp'}</a>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MODAL FORM
// ==========================================
function PatientModal({ patient, onClose, onSave }) {
  const [formData, setFormData] = useState(patient || { pasta: '', nome: '', celular: '', whatsapp: '', status: 'Ativo', nascimento: '', cpf: '', endereco: '', bairro: '', cidade: '', email: '', profissao: '', plano: 'Particular', obs: '' });
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="text-xl font-bold text-slate-800">{patient ? 'Editar' : 'Novo'} Paciente</h3><button onClick={onClose}><X /></button></div>
        <div className="p-6 overflow-y-auto flex-1">
          <form id="p-form" onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Pasta" className="p-2 border rounded-lg" value={formData.pasta} onChange={e => setFormData({...formData, pasta: e.target.value})} />
            <input required type="text" placeholder="Nome Completo" className="p-2 border rounded-lg" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
            <select className="p-2 border rounded-lg" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option>Ativo</option><option>Em Tratamento</option><option>Em aberto</option><option>Em Pendências</option><option>Inativo</option></select>
            <input type="text" placeholder="Celular" className="p-2 border rounded-lg" value={formData.celular} onChange={e => setFormData({...formData, celular: e.target.value})} />
            <input type="text" placeholder="Plano" className="p-2 border rounded-lg" value={formData.plano} onChange={e => setFormData({...formData, plano: e.target.value})} />
            <textarea placeholder="Observações" className="md:col-span-2 p-2 border rounded-lg h-24" value={formData.obs} onChange={e => setFormData({...formData, obs: e.target.value})} />
          </form>
        </div>
        <div className="p-4 bg-slate-50 border-t flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Cancelar</button><button type="submit" form="p-form" className="bg-teal-600 text-white px-6 py-2 rounded-lg font-bold">Salvar Paciente</button></div>
      </div>
    </div>
  );
}

// ==========================================
// DOCUMENTS VIEW - ATUALIZADA COM BARRA DE PESQUISA
// ==========================================
function DocumentsView({ patients, clinicSettings }) {
  const [selectedId, setSelectedId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [docType, setDocType] = useState('receita_simples');
  const [docData, setDocData] = useState({ dias: '1', dataConsulta: new Date().toISOString().split('T')[0], horaInicio: '08:00', horaFim: '09:00', prescricao: 'Uso Interno:\n\n1. Amoxicilina 500mg ------ 1 caixa\nTomar 1 cápsula de 8 em 8 horas por 7 dias.', solicitacaoText: '', avaliacaoText: '', contratoText: '', orcamentoServicos: '', orcamentoPagamento: '' });

  const patient = patients.find(p => p.id === selectedId);

  // Sincroniza a caixa de texto quando um paciente é selecionado
  useEffect(() => {
    if (selectedId && patient) {
      setPatientSearch(patient.nome);
    } else {
      setPatientSearch('');
    }
  }, [selectedId, patient]);

  // Fecha o menu de pesquisa se clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtra os pacientes na barra de pesquisa
  const filteredPatients = useMemo(() => {
    if (!patientSearch) return patients.slice(0, 50); // Mostra os primeiros 50 por defeito para não pesar
    const term = patientSearch.toLowerCase();
    return patients.filter(p => 
      (p.nome && p.nome.toLowerCase().includes(term)) || 
      (p.cpf && p.cpf.includes(term)) ||
      (p.pasta && p.pasta.includes(term))
    ).slice(0, 50); // Limita os resultados a 50
  }, [patients, patientSearch]);

  const handlePrintDoc = () => {
    if (!patient) return alert("Selecione um paciente primeiro.");
    const dateObj = new Date();
    const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    const cidade = clinicSettings.address.split(',').pop().trim() || 'Votorantim';
    const dataExtenso = `${cidade}, ${dateObj.getDate()} de ${meses[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;

    const printIframe = document.createElement('iframe');
    printIframe.style.display = 'none';
    document.body.appendChild(printIframe);
    const doc = printIframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html><head><style>
        @page { margin: 20mm; }
        body { font-family: 'Georgia', serif; color: #1e293b; line-height: 1.6; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #115e59; padding-bottom: 15px; margin-bottom: 30px; }
        .logo-svg { color: #115e59; }
        .clinic-info { text-align: right; font-family: sans-serif; }
        .clinic-info h1 { margin: 0; color: #115e59; font-size: 20px; text-transform: uppercase; }
        .title { text-align: center; font-weight: bold; text-transform: uppercase; border: 1px solid #e2e8f0; background: #f8fafc; padding: 10px; margin-bottom: 30px; letter-spacing: 2px; }
        .content { min-height: 400px; white-space: pre-wrap; }
        .signature { margin-top: 50px; text-align: center; }
        .signature-line { width: 300px; border-top: 1px solid #000; margin: 0 auto 10px; }
        .footer { position: fixed; bottom: 0; width: 100%; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 10px; font-family: sans-serif; }
      </style></head><body>
        <div class="header">
          <svg width="60" height="60" viewBox="0 0 100 100" class="logo-svg"><path d="M25,20 C10,35 15,55 30,65 C40,70 35,85 25,95 C45,95 60,80 55,65 C50,50 65,40 75,30 C85,20 70,10 50,15 C40,17 35,10 25,20 Z" fill="currentColor"/><path d="M60,45 Q80,35 90,40" stroke="currentColor" stroke-width="4" fill="none"/><path d="M65,55 Q85,45 95,50" stroke="currentColor" stroke-width="4" fill="none"/><path d="M70,65 Q90,55 100,60" stroke="currentColor" stroke-width="4" fill="none"/></svg>
          <div class="clinic-info"><h1>${clinicSettings.doctorName}</h1><p>Cirurgião Dentista - ${clinicSettings.cro}</p></div>
        </div>
        <div class="title">${docType.replace('_', ' ')}</div>
        <div class="content"><strong>Paciente:</strong> ${patient.nome}\n\n${docType.includes('receita') ? docData.prescricao : 'Atesto para os devidos fins que o paciente supracitado esteve em consulta profissional nesta data.'}</div>
        <div class="signature"><div class="signature-line"></div><strong>${clinicSettings.doctorName}</strong><br>${clinicSettings.cro}</div>
        <div style="text-align: right; margin-top: 40px; font-style: italic;">${dataExtenso}</div>
        <div class="footer">${clinicSettings.address} | ${clinicSettings.phone}</div>
      </body></html>
    `);
    doc.close();
    setTimeout(() => { printIframe.contentWindow.print(); document.body.removeChild(printIframe); }, 500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Documentos e Receitas</h2>
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        
        {/* Nova Barra de Pesquisa de Paciente */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-sm font-medium text-slate-700 mb-2">1. Selecione o Paciente (Busca Rápida)</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50 transition-all"
              placeholder="Digite o nome, pasta ou CPF..."
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value);
                setIsDropdownOpen(true);
                if (e.target.value === '') setSelectedId('');
              }}
              onFocus={() => setIsDropdownOpen(true)}
            />
            {selectedId && (
              <button 
                onClick={() => { setSelectedId(''); setPatientSearch(''); setIsDropdownOpen(true); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors p-1"
                title="Limpar seleção"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Menu Dropdown com Resultados */}
          {isDropdownOpen && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-y-auto">
              {filteredPatients.length === 0 ? (
                <div className="p-4 text-sm text-slate-500 text-center">Nenhum paciente encontrado.</div>
              ) : (
                filteredPatients.map(p => (
                  <div
                    key={p.id}
                    className="p-3 hover:bg-teal-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors flex justify-between items-center"
                    onClick={() => {
                      setSelectedId(p.id);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{p.nome}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {p.pasta ? <span className="mr-2 font-medium">Pasta: {p.pasta}</span> : null}
                        {p.cpf ? `CPF: ${p.cpf}` : ''}
                      </div>
                    </div>
                    {selectedId === p.id && <Check size={18} className="text-teal-600" />}
                  </div>
                ))
              )}
              {patients.length > 50 && filteredPatients.length === 50 && (
                <div className="p-2 text-xs text-center text-slate-400 bg-slate-50">Continue a digitar para ver mais resultados...</div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">2. Tipo de Documento</label>
          <select className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50" value={docType} onChange={e => setDocType(e.target.value)}>
            <option value="receita_simples">Receituário Simples</option>
            <option value="atestado_repouso">Atestado de Repouso</option>
            <option value="orcamento">Orçamento de Tratamento</option>
          </select>
        </div>

        {docType.includes('receita') && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">3. Prescrição</label>
            <textarea className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 h-48 outline-none resize-none" value={docData.prescricao} onChange={e => setDocData({...docData, prescricao: e.target.value})} />
          </div>
        )}
        
        <div className="pt-2 border-t border-slate-100">
          <button onClick={handlePrintDoc} className="w-full bg-teal-600 text-white py-3.5 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-teal-700 hover:-translate-y-0.5 transition-all">
            <Printer size={20} /> Gerar e Imprimir Documento
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SETTINGS VIEW
// ==========================================
function SettingsView({ clinicSettings, db, user }) {
  const [formData, setFormData] = useState(clinicSettings);
  const handleSave = async () => {
    try {
      await setDoc(doc(db, 'clinicas', user.uid, 'configuracoes', 'geral'), formData, { merge: true });
      alert("Salvo!");
    } catch (e) { alert(e.message); }
  };
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Configurações</h2>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" placeholder="Nome Profissional" className="p-2 border rounded-lg" value={formData.doctorName} onChange={e => setFormData({...formData, doctorName: e.target.value})} />
          <input type="text" placeholder="CRO" className="p-2 border rounded-lg" value={formData.cro} onChange={e => setFormData({...formData, cro: e.target.value})} />
          <input type="text" placeholder="Telefone" className="p-2 border rounded-lg" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <input type="text" placeholder="Endereço" className="md:col-span-2 p-2 border rounded-lg" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
        </div>
        <button onClick={handleSave} className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold shadow-md">Salvar Alterações</button>
      </div>
    </div>
  );
}

// ==========================================
// AUTH SCREEN - Atualizada com Logótipo
// ==========================================
function AuthScreen({ auth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.code === 'auth/invalid-credential' ? 'E-mail ou senha incorretos.' : err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-b from-teal-900 to-teal-800 p-10 text-center text-white">
          <div className="bg-white/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-inner">
            <ClinicLogo size={45} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">OdontoSys</h1>
          <p className="text-teal-100/80 text-sm italic">Gestão Clínica Especializada</p>
        </div>
        <div className="p-8">
          <div className="flex gap-4 mb-8 bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-sm font-semibold rounded-lg ${isLogin ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}`}>Entrar</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-sm font-semibold rounded-lg ${!isLogin ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}`}>Criar Conta</button>
          </div>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required type="email" placeholder="E-mail" className="w-full p-3 border rounded-xl" value={email} onChange={e => setEmail(e.target.value)} />
            <input required type="password" placeholder="Senha" className="w-full p-3 border rounded-xl" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="submit" disabled={loading} className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl shadow-md flex justify-center items-center gap-2">
              {loading ? 'Aguarde...' : (isLogin ? 'Entrar no Sistema' : 'Registar Consultório')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}