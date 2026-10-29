import mongoose from 'mongoose';

async function popularBanco() {
  await mongoose.connect('mongodb://127.0.0.1:27017/agenda_saude_bem_estar');
  const db = mongoose.connection.db;

  const medicosPadrao = [
    { nome: 'Dr. Marcelo Santos', especialidade: 'Cardiologia', criadoEm: new Date() },
    { nome: 'Dra. Camila Rocha', especialidade: 'Pediatria', criadoEm: new Date() },
    { nome: 'Dr. Fernando Lima', especialidade: 'Clínica Geral', criadoEm: new Date() },
    { nome: 'Dra. Beatriz Ramos', especialidade: 'Dermatologia', criadoEm: new Date() },
  ];

  for (const m of medicosPadrao) {
    await db.collection('doutors').updateOne(
      { nome: m.nome },
      { $set: m },
      { upsert: true }
    );
  }

  const pacientesPadrao = [
    { nome: 'Beatriz Guimarães', telefone: '(11) 98765-4321', criadoEm: new Date() },
    { nome: 'Helena Silveira Nogueira', telefone: '(11) 98842-1209', criadoEm: new Date() },
    { nome: 'Lucas Vasconcelos de Castro', telefone: '(11) 97103-4921', criadoEm: new Date() },
    { nome: 'Mariana Alvarenga Ribeiro', telefone: '(11) 99120-7744', criadoEm: new Date() },
    { nome: 'Carlos Eduardo Menezes', telefone: '(11) 97654-3321', criadoEm: new Date() },
  ];

  for (const p of pacientesPadrao) {
    await db.collection('pacientes').updateOne(
      { nome: p.nome },
      { $set: p },
      { upsert: true }
    );
  }

  const totalDoutors = await db.collection('doutors').countDocuments();
  const totalPacientes = await db.collection('pacientes').countDocuments();
  console.log(`Doutores cadastrados: ${totalDoutors}, Pacientes cadastrados: ${totalPacientes}`);
  await mongoose.disconnect();
}

popularBanco().catch(console.error);
