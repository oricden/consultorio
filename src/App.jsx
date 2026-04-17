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
// DOCUMENTS VIEW - COMPLETA COM PESQUISA
// ==========================================
function DocumentsView({ patients, clinicSettings }) {
  const [selectedId, setSelectedId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [docType, setDocType] = useState('receita_simples');
  const [docData, setDocData] = useState({
    dias: '1',
    dataConsulta: new Date().toISOString().split('T')[0],
    horaInicio: '08:00',
    horaFim: '09:00',
    prescricao: 'Uso Interno:\n\n1. Amoxicilina 500mg ------ 1 caixa\nTomar 1 cápsula de 8 em 8 horas por 7 dias.\n\n2. Ibuprofeno 400mg ------ 1 caixa\nTomar 1 comprimido de 8 em 8 horas em caso de dor.',
    observacao: '',
    solicitacaoText: 'Solicito a avaliação e conduta clínica para o(a) paciente supracitado(a).\n\nMotivo do Encaminhamento:\n- \n\nExames Solicitados:\n1. Radiografia Panorâmica\n2. ',
    orientacaoText: 'ORIENTAÇÕES IMPORTANTES PARA UMA BOA RECUPERAÇÃO:\n\n1. Repouso nas primeiras 24 horas;\n2. Alimentação líquida ou pastosa e fria nas primeiras 24h;\n3. Não fazer bochechos intensos ou cuspir nos primeiros 2 dias;\n4. Aplicar compressa de gelo na face (15 min) nas primeiras 24h para evitar inchaço;\n5. Escovar os dentes normalmente, com cuidado na área operada;\n6. Tomar a medicação prescrita rigorosamente no horário;\n7. Evitar exposição ao sol e esforços físicos na primeira semana;\n\nEm caso de dor intensa, inchaço excessivo ou sangramento anormal, entre em contato imediatamente.',
    avaliacaoText: 'Avaliação clínica realizada na presente data.\n\nAchados clínicos:\n- \n\nPlano de Tratamento Proposto:\n- ',
    contratoText: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS ODONTOLÓGICOS\n\n1. OBJETO DO CONTRATO\nO presente contrato tem como objeto a prestação de serviços odontológicos constantes no plano de tratamento aprovado pelo CONTRATANTE.\n\n2. OBRIGAÇÕES DO PROFISSIONAL\nO CONTRATADO compromete-se a executar os serviços odontológicos com zelo, utilizando técnicas e materiais adequados, garantindo a qualidade do tratamento dentro dos limites da ciência odontológica.\n\n3. OBRIGAÇÕES DO PACIENTE (CONTRATANTE)\nO CONTRATANTE compromete-se a comparecer pontualmente às consultas, seguir rigorosamente as prescrições e orientações pós-operatórias, e efetuar o pagamento dos honorários ajustados.\n\n4. HONORÁRIOS E FORMA DE PAGAMENTO\nO total do tratamento, bem como a forma de pagamento, encontram-se descritos no orçamento previamente aprovado e assinado pelas partes, que passa a fazer parte integrante deste contrato.',
    orcamentoServicos: '1. Profilaxia e Raspagem ................. R$ 200,00\n2. Restauração Resina Dente 36 ........... R$ 250,00\n\nValor Total do Tratamento: R$ 450,00',
    orcamentoPagamento: 'Opção 1: À vista com 5% de desconto (R$ 427,50).\nOpção 2: Entrada de R$ 150,00 + 2 parcelas de R$ 150,00 no cartão de crédito.'
  });

  const selectedPatient = patients.find(p => p.id === selectedId);

  const handleDataChange = (e) => {
    const { name, value } = e.target;
    setDocData(prev => ({ ...prev, [name]: value }));
  };

  // Sincroniza a caixa de texto quando um paciente é selecionado
  useEffect(() => {
    if (selectedId && selectedPatient) {
      setPatientSearch(selectedPatient.nome);
    } else {
      setPatientSearch('');
    }
  }, [selectedId, selectedPatient]);

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
    if (!patientSearch) return patients.slice(0, 50); // Mostra 50 para não pesar
    const term = patientSearch.toLowerCase();
    return patients.filter(p => 
      (p.nome && p.nome.toLowerCase().includes(term)) || 
      (p.cpf && p.cpf.includes(term)) ||
      (p.pasta && p.pasta.includes(term))
    ).slice(0, 50);
  }, [patients, patientSearch]);

  const getOdontogramaHTML = () => {
    const createTooth = (num) => `
      <div style="display: flex; flex-direction: column; align-items: center; margin: 2px;">
        <span style="font-size: 11px; font-weight: bold; font-family: Arial, sans-serif; color: #475569; margin-bottom: 2px;">${num}</span>
        <svg width="28" height="28" viewBox="0 0 40 40" style="display: block;">
          <polygon points="0,0 40,0 30,10 10,10" fill="white" stroke="#64748b" stroke-width="1.2"/>
          <polygon points="0,40 40,40 30,30 10,30" fill="white" stroke="#64748b" stroke-width="1.2"/>
          <polygon points="0,0 10,10 10,30 0,40" fill="white" stroke="#64748b" stroke-width="1.2"/>
          <polygon points="40,0 30,10 30,30 40,40" fill="white" stroke="#64748b" stroke-width="1.2"/>
          <rect x="10" y="10" width="20" height="20" fill="white" stroke="#64748b" stroke-width="1.2"/>
        </svg>
      </div>
    `;
    const upperRight = [18,17,16,15,14,13,12,11];
    const upperLeft = [21,22,23,24,25,26,27,28];
    const lowerRight = [48,47,46,45,44,43,42,41];
    const lowerLeft = [31,32,33,34,35,36,37,38];

    return `
      <div style="margin-top: 25px; margin-bottom: 30px; width: 100%; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background: #f8fafc; box-sizing: border-box;">
        <div style="text-align: center; font-size: 12px; font-weight: bold; color: #64748b; margin-bottom: 12px; font-family: Arial, sans-serif; letter-spacing: 1px;">ODONTOGRAMA</div>
        <div style="display: flex; justify-content: center; gap: 4px; margin-bottom: 15px;">
          <div style="display: flex; gap: 2px; border-right: 2px solid #cbd5e1; padding-right: 8px;">${upperRight.map(createTooth).join('')}</div>
          <div style="display: flex; gap: 2px; padding-left: 8px;">${upperLeft.map(createTooth).join('')}</div>
        </div>
        <div style="display: flex; justify-content: center; gap: 4px;">
          <div style="display: flex; gap: 2px; border-right: 2px solid #cbd5e1; padding-right: 8px;">${lowerRight.map(createTooth).join('')}</div>
          <div style="display: flex; gap: 2px; padding-left: 8px;">${lowerLeft.map(createTooth).join('')}</div>
        </div>
      </div>
    `;
  };

  const buildDocAssets = () => {
    const dateObj = new Date();
    const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    const cidadeBase = clinicSettings.address.split('-')[0].split(',').pop().trim() || 'Votorantim';
    const dataExtenso = `${cidadeBase}, ${dateObj.getDate()} de ${meses[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;

    const patientInfoBlock = selectedPatient ? `
      <div style="margin-bottom: 10px; font-size: 11px; line-height: 1.3; border: 1px solid #e2e8f0; padding: 8px; border-radius: 6px; background: #fcfcfc;">
        <div style="margin-bottom: 4px; font-size: 12px; font-weight: bold; color: #115e59; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">DADOS DO PACIENTE</div>
        <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;">
          <tr>
            <td style="padding: 1px 0; width: 60%;"><strong>Nome:</strong> ${selectedPatient.nome || ''}</td>
            <td style="padding: 1px 0; width: 40%;"><strong>Nascimento:</strong> ${selectedPatient.nascimento ? selectedPatient.nascimento.split('-').reverse().join('/') : '-'}</td>
          </tr>
          <tr>
            <td style="padding: 1px 0;"><strong>CPF:</strong> ${selectedPatient.cpf || '-'}</td>
            <td style="padding: 1px 0;"><strong>Profissão:</strong> ${selectedPatient.profissao || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 1px 0;"><strong>Celular/WhatsApp:</strong> ${selectedPatient.celular || '-'} ${selectedPatient.whatsapp && selectedPatient.whatsapp !== selectedPatient.celular ? ` / ${selectedPatient.whatsapp}` : ''}</td>
            <td style="padding: 1px 0;"><strong>E-mail:</strong> ${selectedPatient.email || '-'}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 1px 0;"><strong>Endereço:</strong> ${selectedPatient.endereco || '-'}, ${selectedPatient.bairro || '-'} - ${selectedPatient.cidade || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 1px 0;"><strong>Plano/Convênio:</strong> ${selectedPatient.plano || '-'}</td>
            <td style="padding: 1px 0;"><strong>Pasta:</strong> ${selectedPatient.pasta || '-'}</td>
          </tr>
        </table>
      </div>
    ` : '';

    let contentHtml = '';
    let docTitle = '';

    if (docType === 'receita_simples' || docType === 'receita_controle') {
      docTitle = 'RECEITUÁRIO';
      contentHtml = `
        <div style="margin-bottom: 20px;">
          <p style="font-size: 15px;"><strong>Para:</strong> ${selectedPatient?.nome || ''}</p>
          ${docType === 'receita_controle' ? `<p style="font-size: 13px; margin-top: -10px;"><strong>Endereço:</strong> ${selectedPatient?.endereco || ''}, ${selectedPatient?.cidade || ''}</p>` : ''}
        </div>
        <div style="font-size: 14px; line-height: 1.8; white-space: pre-wrap;">${docData.prescricao}</div>
      `;
    } 
    else if (docType === 'atestado_dias') {
      docTitle = 'ATESTADO ODONTOLÓGICO';
      contentHtml = `
        <p style="text-indent: 40px; font-size: 16px; line-height: 2;">
          Atesto para os devidos fins que o(a) paciente <strong>${selectedPatient?.nome || ''}</strong>, 
          inscrito(a) no CPF sob o nº ${selectedPatient?.cpf || '___________________'}, necessita de <strong>${docData.dias}</strong> 
          dia(s) de repouso a partir desta data, por motivo de tratamento odontológico.
        </p>
        ${docData.observacao ? `<p style="font-size: 14px; margin-top: 20px;"><strong>Observação:</strong> ${docData.observacao}</p>` : ''}
      `;
    }
    else if (docType === 'declaracao_comparecimento' || docType === 'atestado_comparecimento') {
      docTitle = docType === 'declaracao_comparecimento' ? 'DECLARAÇÃO DE COMPARECIMENTO' : 'ATESTADO DE COMPARECIMENTO';
      const dataConv = docData.dataConsulta.split('-').reverse().join('/');
      contentHtml = `
        <p style="text-indent: 40px; font-size: 16px; line-height: 2;">
          ${docType === 'declaracao_comparecimento' ? 'Declaro' : 'Atesto'} para os devidos fins que o(a) paciente <strong>${selectedPatient?.nome || ''}</strong>, 
          inscrito(a) no CPF sob o nº ${selectedPatient?.cpf || '___________________'}, esteve sob meus cuidados 
          profissionais em consulta odontológica no dia <strong>${dataConv}</strong>, 
          no período das <strong>${docData.horaInicio}</strong> às <strong>${docData.horaFim}</strong>.
        </p>
      `;
    }
    else if (docType === 'solicitacao') {
      docTitle = 'SOLICITAÇÃO / ENCAMINHAMENTO';
      contentHtml = `
        <div style="margin-bottom: 20px;">
          <p style="font-size: 15px;"><strong>Paciente:</strong> ${selectedPatient?.nome || ''}</p>
        </div>
        <div style="font-size: 14px; line-height: 1.8; white-space: pre-wrap;">${docData.solicitacaoText}</div>
      `;
    }
    else if (docType === 'orientacao_pos_op') {
      docTitle = 'ORIENTAÇÕES PÓS-OPERATÓRIAS';
      contentHtml = `
        <div style="margin-bottom: 20px;">
          <p style="font-size: 15px;"><strong>Paciente:</strong> ${selectedPatient?.nome || ''}</p>
        </div>
        <div style="font-size: 14px; line-height: 1.8; white-space: pre-wrap;">${docData.orientacaoText}</div>
      `;
    }
    else if (docType === 'avaliacao') {
      docTitle = 'AVALIAÇÃO ODONTOLÓGICA';
      contentHtml = `
        ${patientInfoBlock}
        ${getOdontogramaHTML()}
        <div style="font-size: 13px; line-height: 1.6; white-space: pre-wrap;">${docData.avaliacaoText}</div>
      `;
    }
    else if (docType === 'contrato') {
      docTitle = 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS';
      contentHtml = `
        <div style="font-size: 12px; margin-bottom: 8px;">
          <strong>CONTRATADO:</strong> ${clinicSettings.doctorName}, inscrito(a) no ${clinicSettings.cro}, com consultório na ${clinicSettings.address}.
        </div>
        <div style="font-size: 12px; margin-bottom: 4px;">
          <strong>CONTRATANTE:</strong>
        </div>
        ${patientInfoBlock}
        <div style="font-size: 12px; line-height: 1.4; white-space: pre-wrap; text-align: justify;">${docData.contratoText}</div>

        <div style="display: flex; justify-content: space-between; margin-top: 25px; text-align: center; font-family: 'Arial', sans-serif;">
          <div style="width: 45%;">
            <div style="border-top: 1px solid #1e293b; margin: 0 auto 5px;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 12px; color: #0f172a;">${clinicSettings.doctorName}</p>
            <p style="margin: 2px 0 0; font-size: 10px; color: #475569;">CONTRATADO</p>
          </div>
          <div style="width: 45%;">
            <div style="border-top: 1px solid #1e293b; margin: 0 auto 5px;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 12px; color: #0f172a;">${selectedPatient ? selectedPatient.nome : 'CONTRATANTE'}</p>
            <p style="margin: 2px 0 0; font-size: 10px; color: #475569;">CONTRATANTE</p>
          </div>
        </div>
      `;
    }
    else if (docType === 'orcamento') {
      docTitle = 'ORÇAMENTO DE TRATAMENTO';
      contentHtml = `
        ${patientInfoBlock}
        <div style="margin-top: 10px;">
            <h3 style="font-size: 13px; color: #115e59; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 6px;">SERVIÇOS ORÇADOS</h3>
            <div style="font-size: 12px; line-height: 1.5; white-space: pre-wrap; background: #f8fafc; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px;">${docData.orcamentoServicos}</div>
        </div>
        <div style="margin-top: 10px;">
            <h3 style="font-size: 13px; color: #115e59; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; margin-bottom: 6px;">CONDIÇÕES DE PAGAMENTO</h3>
            <div style="font-size: 12px; line-height: 1.5; white-space: pre-wrap; background: #f0fdf4; padding: 8px; border: 1px solid #bbf7d0; border-radius: 6px; color: #166534;">${docData.orcamentoPagamento}</div>
        </div>
        <div style="font-size: 10px; color: #64748b; margin-top: 10px; text-align: justify; font-style: italic;">
           * Este orçamento tem validade de 15 dias a partir da data de emissão. Os valores e condições estão sujeitos a alterações após este prazo ou caso haja mudança justificada no plano de tratamento clínico durante a execução.
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 25px; text-align: center; font-family: 'Arial', sans-serif;">
          <div style="width: 45%;">
            <div style="border-top: 1px solid #1e293b; margin: 0 auto 5px;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 12px; color: #0f172a;">${clinicSettings.doctorName}</p>
            <p style="margin: 2px 0 0; font-size: 10px; color: #475569;">CIRURGIÃO DENTISTA</p>
          </div>
          <div style="width: 45%;">
            <div style="border-top: 1px solid #1e293b; margin: 0 auto 5px;"></div>
            <p style="margin: 0; font-weight: bold; font-size: 12px; color: #0f172a;">${selectedPatient ? selectedPatient.nome : 'PACIENTE / RESPONSÁVEL'}</p>
            <p style="margin: 2px 0 0; font-size: 10px; color: #475569;">ACEITE DO ORÇAMENTO</p>
          </div>
        </div>
      `;
    }

    const logoSvg = `
      <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M25,20 C10,35 15,55 30,65 C40,70 35,85 25,95 C45,95 60,80 55,65 C50,50 65,40 75,30 C85,20 70,10 50,15 C40,17 35,10 25,20 Z" fill="#115e59"/>
        <path d="M60,45 Q80,35 90,40" stroke="#115e59" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M65,55 Q85,45 95,50" stroke="#115e59" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M70,65 Q90,55 100,60" stroke="#115e59" stroke-width="4" fill="none" stroke-linecap="round"/>
      </svg>
    `;

    const logoRender = clinicSettings.logo 
      ? `<img src="${clinicSettings.logo}" style="max-height: 80px; max-width: 250px; object-fit: contain;" />` 
      : logoSvg;

    return { docTitle, contentHtml, dataExtenso, logoRender };
  };

  const handlePrintDoc = () => {
    if (!selectedPatient) {
      alert("Por favor, selecione um paciente primeiro.");
      return;
    }
    const { docTitle, contentHtml, dataExtenso, logoRender } = buildDocAssets();
    let printIframe = document.getElementById('print-doc-iframe');
    if (!printIframe) {
      printIframe = document.createElement('iframe');
      printIframe.id = 'print-doc-iframe';
      printIframe.style.position = 'absolute';
      printIframe.style.width = '0px';
      printIframe.style.height = '0px';
      printIframe.style.border = 'none';
      document.body.appendChild(printIframe);
    }
    const doc = printIframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impressão - ${docTitle}</title>
          <style>
            @page { margin: 0; }
            body { font-family: 'Georgia', 'Times New Roman', serif; color: #1e293b; margin: 0; padding: 0; }
            .papel-timbrado { width: 210mm; min-height: 297mm; padding: 20mm 20mm; box-sizing: border-box; position: relative; margin: 0 auto; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #115e59; padding-bottom: 10px; margin-bottom: 15px; position: relative; }
            .header::after { content: ''; position: absolute; bottom: -6px; left: 0; right: 0; border-bottom: 1px solid #115e59; opacity: 0.3; }
            .logo { flex: 0 0 auto; }
            .header-info { text-align: right; font-family: 'Arial', sans-serif; }
            .header-info h1 { margin: 0; color: #115e59; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; }
            .header-info p { margin: 4px 0 0; color: #475569; font-size: 12px; font-weight: bold; letter-spacing: 0.5px; }
            .doc-title { text-align: center; font-size: 14px; font-weight: bold; font-family: 'Arial', sans-serif; border: 1px solid #e2e8f0; padding: 4px 10px; margin: 0 auto 15px; width: fit-content; border-radius: 4px; background: #f8fafc; letter-spacing: 1.5px; }
            .content { font-size: 13px; }
            .signature { margin-top: 25px; text-align: center; font-family: 'Arial', sans-serif; }
            .signature-line { width: 250px; border-top: 1px solid #1e293b; margin: 0 auto 10px; }
            .footer { position: absolute; bottom: 15mm; left: 20mm; right: 20mm; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; color: #64748b; font-size: 11px; font-family: 'Arial', sans-serif; }
          </style>
        </head>
        <body>
          <div class="papel-timbrado">
            <div class="header">
              <div class="logo">${logoRender}</div>
              <div class="header-info">
                <h1>${clinicSettings.doctorName}</h1>
                <p>Cirurgião Dentista - ${clinicSettings.cro}</p>
              </div>
            </div>
            <div class="doc-title">${docTitle}</div>
            <div class="content">${contentHtml}</div>
            ${docType !== 'contrato' && docType !== 'orcamento' ? `
            <div class="signature">
              <div class="signature-line"></div>
              <p style="margin: 0; font-weight: bold; font-size: 14px; color: #0f172a;">${clinicSettings.doctorName}</p>
              <p style="margin: 2px 0 0; font-size: 12px; color: #475569;">${clinicSettings.cro}</p>
            </div>` : ''}
            <div style="text-align: right; margin-top: 15px; font-size: 11px; font-style: italic;">${dataExtenso}</div>
            <div class="footer">
              <p style="margin: 0; font-weight: bold; color: #334155;">${clinicSettings.address}</p>
              <p style="margin: 4px 0 0;">Telefone / WhatsApp: ${clinicSettings.phone}</p>
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();
    setTimeout(() => {
      printIframe.contentWindow.focus();
      printIframe.contentWindow.print();
    }, 500);
  };

  const handleDownloadDocPDF = () => {
    if (!selectedPatient) {
      alert("Por favor, selecione um paciente primeiro.");
      return;
    }
    const { docTitle, contentHtml, dataExtenso, logoRender } = buildDocAssets();
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: 'Georgia', 'Times New Roman', serif; color: #1e293b; padding: 20px; box-sizing: border-box; background: #fff;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #115e59; padding-bottom: 10px; margin-bottom: 15px;">
          <div>${logoRender}</div>
          <div style="text-align: right; font-family: 'Arial', sans-serif;">
            <h1 style="margin: 0; color: #115e59; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">${clinicSettings.doctorName}</h1>
            <p style="margin: 4px 0 0; color: #475569; font-size: 12px; font-weight: bold;">Cirurgião Dentista - ${clinicSettings.cro}</p>
          </div>
        </div>
        <div style="text-align: center; font-size: 14px; font-weight: bold; font-family: 'Arial', sans-serif; border: 1px solid #e2e8f0; padding: 4px 10px; margin: 0 auto 15px; width: fit-content; border-radius: 4px; background: #f8fafc; letter-spacing: 1.5px;">
          ${docTitle}
        </div>
        <div style="font-size: 13px;">${contentHtml}</div>
        ${docType !== 'contrato' && docType !== 'orcamento' ? `
        <div style="margin-top: 25px; text-align: center; font-family: 'Arial', sans-serif;">
          <div style="width: 250px; border-top: 1px solid #1e293b; margin: 0 auto 10px;"></div>
          <p style="margin: 0; font-weight: bold; font-size: 13px; color: #0f172a;">${clinicSettings.doctorName}</p>
          <p style="margin: 2px 0 0; font-size: 11px; color: #475569;">${clinicSettings.cro}</p>
        </div>` : ''}
        <div style="text-align: right; margin-top: 15px; font-size: 11px; font-style: italic;">${dataExtenso}</div>
        <div style="margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; color: #64748b; font-size: 10px; font-family: 'Arial', sans-serif;">
          <p style="margin: 0; font-weight: bold; color: #334155;">${clinicSettings.address}</p>
          <p style="margin: 4px 0 0;">Telefone / WhatsApp: ${clinicSettings.phone}</p>
        </div>
      </div>
    `;

    const fileNameFormatado = `${docTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${(selectedPatient.nome || 'paciente').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    const opt = {
      margin: 10,
      filename: fileNameFormatado,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const doDownload = () => window.html2pdf().set(opt).from(element).save();

    if (window.html2pdf) {
      doDownload();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = doDownload;
      document.body.appendChild(script);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Documentos e Receitas</h2>
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        
        {/* Barra de Pesquisa de Paciente */}
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
            <optgroup label="Receitas e Prescrições">
              <option value="receita_simples">Receituário Simples</option>
              <option value="receita_controle">Receituário Controle Especial (2 vias)</option>
            </optgroup>
            <optgroup label="Atestados e Declarações">
              <option value="atestado_dias">Atestado de Repouso (Dias)</option>
              <option value="declaracao_comparecimento">Declaração de Comparecimento</option>
            </optgroup>
            <optgroup label="Clínicos">
              <option value="solicitacao">Solicitação / Encaminhamento</option>
              <option value="orientacao_pos_op">Orientação Pós-Operatório</option>
              <option value="avaliacao">Avaliação Clínica</option>
            </optgroup>
            <optgroup label="Administrativo e Legal">
              <option value="orcamento">Orçamento de Tratamento</option>
              <option value="contrato">Contrato de Prestação de Serviços</option>
            </optgroup>
          </select>
        </div>

        {/* Campos Condicionais conforme o Tipo de Documento */}
        {docType === 'atestado_dias' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade de Dias</label>
              <input type="number" name="dias" value={docData.dias} onChange={handleDataChange} min="1" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Observações (Opcional - ex: CID)</label>
              <input type="text" name="observacao" value={docData.observacao} onChange={handleDataChange} placeholder="Ex: CID K04.7" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
          </div>
        )}

        {(docType === 'declaracao_comparecimento' || docType === 'atestado_comparecimento') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data da Consulta</label>
              <input type="date" name="dataConsulta" value={docData.dataConsulta} onChange={handleDataChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hora Início</label>
              <input type="time" name="horaInicio" value={docData.horaInicio} onChange={handleDataChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hora Fim</label>
              <input type="time" name="horaFim" value={docData.horaFim} onChange={handleDataChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
          </div>
        )}

        {(docType === 'receita_simples' || docType === 'receita_controle') && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">3. Prescrição Médica</label>
            <textarea name="prescricao" value={docData.prescricao} onChange={handleDataChange} rows="8" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none bg-yellow-50/30"></textarea>
          </div>
        )}

        {docType === 'solicitacao' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Texto da Solicitação / Encaminhamento</label>
            <textarea name="solicitacaoText" value={docData.solicitacaoText} onChange={handleDataChange} rows="8" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none bg-blue-50/30"></textarea>
          </div>
        )}

        {docType === 'orientacao_pos_op' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Orientações ao Paciente</label>
            <textarea name="orientacaoText" value={docData.orientacaoText} onChange={handleDataChange} rows="10" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none bg-green-50/30"></textarea>
          </div>
        )}

        {docType === 'avaliacao' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Ficha de Avaliação Clínica</label>
            <textarea name="avaliacaoText" value={docData.avaliacaoText} onChange={handleDataChange} rows="8" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none bg-purple-50/30"></textarea>
          </div>
        )}

        {docType === 'contrato' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Termos do Contrato</label>
            <textarea name="contratoText" value={docData.contratoText} onChange={handleDataChange} rows="10" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none bg-orange-50/30 text-sm"></textarea>
          </div>
        )}

        {docType === 'orcamento' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Serviços Orçados</label>
              <textarea name="orcamentoServicos" value={docData.orcamentoServicos} onChange={handleDataChange} rows="6" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none bg-slate-50 text-sm"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Condições de Pagamento</label>
              <textarea name="orcamentoPagamento" value={docData.orcamentoPagamento} onChange={handleDataChange} rows="3" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none bg-green-50/50 text-sm"></textarea>
            </div>
          </div>
        )}
        
        {/* Botões de Ação Restaurados */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-slate-100">
          <button onClick={handlePrintDoc} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-all shadow-sm text-lg">
            <Printer size={22} /> Imprimir
          </button>
          <button onClick={handleDownloadDocPDF} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-all shadow-lg hover:shadow-red-700/30 hover:-translate-y-0.5 text-lg">
            <FileDown size={22} /> Salvar PDF
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
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'clinicas', user.uid, 'configuracoes', 'geral'), formData, { merge: true });
      alert("Configurações salvas com sucesso!");
    } catch (e) { 
      alert(`Erro ao salvar: ${e.message}`); 
    }
    setIsSaving(false);
  };
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Configurações da Clínica</h2>
        <p className="text-slate-500">Personalize o visual e os dados que aparecerão nos documentos.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-8">
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Identidade Visual (Logotipo)</h3>
          <div className="flex items-center gap-6">
            <div className="w-48 h-32 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center overflow-hidden">
              {formData.logo ? (
                <img src={formData.logo} alt="Logo" className="max-w-full max-h-full object-contain p-2" />
              ) : (
                <div className="text-slate-400 flex flex-col items-center">
                  <ImagePlus size={32} />
                  <span className="text-sm mt-2">Sem logo</span>
                </div>
              )}
            </div>
            <div>
              <input type="file" accept="image/png, image/jpeg" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" />
              <button onClick={() => fileInputRef.current.click()} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors mb-2 block shadow-sm">
                Escolher Imagem...
              </button>
              <p className="text-sm text-slate-500">Formatos aceitos: PNG ou JPG. Fundo transparente (PNG) recomendado.</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Dados Profissionais (Cabeçalho/Rodapé)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Profissional / Clínica</label>
              <input type="text" name="doctorName" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" value={formData.doctorName} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Registro (ex: CROSP)</label>
              <input type="text" name="cro" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" value={formData.cro} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
              <input type="text" name="phone" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
              <input type="text" name="address" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" value={formData.address} onChange={handleChange} />
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <button onClick={handleSave} disabled={isSaving} className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-xl font-bold shadow-md">
            {isSaving ? 'A guardar...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// AUTH SCREEN
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
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input required type="email" placeholder="E-mail" className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input required type="password" placeholder="Senha" className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl shadow-md flex justify-center items-center gap-2">
              {loading ? 'Aguarde...' : (isLogin ? 'Entrar no Sistema' : 'Registar Consultório')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}