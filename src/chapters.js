import { PEOPLE, noteMesh, keyMesh, flashlightMesh, batteryMesh, markerMesh, photoMesh } from './world/Models.js';

export const CHAPTERS = [
  // =========================================================================
  // CAPÍTULO 1: PRIMER TURNO
  // =========================================================================
  {
    title: 'Capítulo 1: Primer Turno',
    sub: 'La regla del último piso',
    startFloor: 1,
    start: [4.2, 6.0, Math.PI / 2],
    async run(game) {
      const { hospital, audio } = game;
      hospital.setLights(true);

      // Compañeras de turno paradas frente al mostrador de recepción
      const marta = game.actor('marta', 'marta');
      marta.place(1, 2.2, 5.2, Math.PI / 2);
      const silvia = game.actor('silvia', 'silvia');
      silvia.place(1, 2.2, 6.8, Math.PI / 2);

      await game.title('CAPÍTULO 1', 'PRIMER TURNO', 'Hospital San Anselmo · 23:55 PM');
      await game.fade(0, 1.2);
      game.cine(true);

      await game.lookAt(2.2 * 3, 1.5, 6.0 * 3, 1.2);
      await game.say('Clara, bienvenida formalmente al turno noche del San Anselmo.', 'Marta');
      await game.say('El hospital es de los años 50. Los pisos crujen con el viento, pero los pacientes de planta baja duermen temprano.', 'Marta');
      await game.say('En el escritorio te dejamos el libro de registro de guardia, los reportes médicos y las llaves comunes.', 'Silvia');
      await game.say('Pero antes de irnos a descansar... hay una regla inquebrantable en este turno.', 'Silvia');
      await game.say('¿Una regla?... ¿De qué se trata?', 'Clara', { thought: true });
      await game.say('NUNCA mires las cámaras del último piso. El piso 4 está completamente clausurado y fuera de servicio.', 'Silvia');
      await game.say('¿Por qué? ¿Qué ocurrió en ese piso?', 'Clara');
      await game.say('La última recepcionista que estuvo en tu lugar, Andrea... las miró durante una madrugada.', 'Marta');
      await game.say('Hoy está internada en el psiquiátrico provincial de Santa Inés. No reconoce a su familia.', 'Marta');
      await game.say('Solo se balancea en su cama y repite sin parar: "Él sigue arriba... él sigue arriba en la oscuridad...".', 'Marta');
      await game.say('No es ninguna broma de bienvenida, Clara. Puedes vigilar la entrada, el piso 2 y el piso 3.', 'Silvia');
      await game.say('El botón de la Cámara 4 en la consola... ni se te ocurra tocarlo.', 'Silvia');

      // Las compañeras se despiden y salen hacia la entrada principal
      await game.say('Que tengas una guardia tranquila. Nos vemos mañana a las 7:00 AM.', 'Silvia');
      game.walk(marta, 0, 6, 2.0);
      await game.sleep(0.4);
      await game.walk(silvia, 0, 6, 2.0);
      marta.hide();
      silvia.hide();
      audio.door();

      game.cine(false);
      game.objective('Revisa los monitores de seguridad en el mostrador');

      // Libro de registro sobre el mostrador para ambientación
      game.place({
        id: 'shift_logbook',
        floor: 1,
        x: 3.6,
        y: 1.14,
        z: 5.2,
        range: 2.8,
        label: 'Libro de guardia nocturna',
        model: noteMesh,
        async onUse(g) {
          audio.paper();
          await g.note(
            'Libro de Guardia · Hospital San Anselmo',
            'Últimas anotaciones:\n\n- 08/Oct: Ruido de pasos arrastrándose en el cielo raso sobre el pasillo norte. No hay pacientes en esa ala.\n\n- 11/Oct: La recepcionista Andrea reporta interferencias en los monitores y olor a humedad estancada.\n\n- 12/Oct: [PÁGINA MANCHADA] "Alguien me robó el marcador del escritorio. Sé que alguien entra a la recepción mientras bajo la vista".'
          );
          await g.say('La recepcionista anterior también notó que le faltaban cosas...', 'Clara', { thought: true });
        }
      });

      // Monitor de seguridad en el mostrador
      let cctvUsed = false;
      game.place({
        id: 'monitor_cctv',
        floor: 1,
        x: 3.6,
        y: 1.15,
        z: 6.0,
        range: 3.2,
        label: 'Monitores de seguridad (CCTV)',
        async onUse(g) {
          if (cctvUsed) return;
          cctvUsed = true;
          g.cine(true);

          const ans = await g.choice(
            '¿Qué deseas hacer con las cámaras de seguridad del hospital?',
            'Mirar la cámara prohibida del último piso (Piso 4)',
            'No mirar las cámaras prohibidas y revisar los pisos 1, 2 y 3'
          );

          if (ans === 1) {
            // =========================================================
            // OPCIÓN B: NO MIRAR LAS CÁMARAS PROHIBIDAS (CANON)
            // =========================================================
            g.remember('choice1', 'B');
            g.cctvState = { cam4On: false, ghostOnCam: 2 };
            await g.cctv();

            // Susto del reflejo en el monitor CRT
            audio.whisper();
            g.cctvState = { reflection: true, reflectionFigure: true };
            await g.cctv();

            await g.say('Espera un segundo... ¿qué es esa silueta en el reflejo de la pantalla?...', 'Clara', { thought: true });
            g.shakeCam(0.9);
            audio.thump();

            // Girarse rápidamente hacia atrás
            await g.lookAt(5.8 * 3, 1.6, 6.0 * 3, 0.35);
            await g.say('¡¿Quién está ahí?! ¡Seguridad!', 'Clara');
            await g.sleep(1.2);
            await g.say('No hay nadie... Qué extraño. Juraría por mi vida que vi a un niño parado detrás de mí.', 'Clara', { thought: true });

            // Volver a mirar los monitores
            await g.lookAt(3.6 * 3, 1.2, 6.0 * 3, 0.45);
            hospital.flicker(2.5);
            audio.static_();
            g.cctvState = { reflection: false, cam4On: true, cam4Ghost: true };
            await g.say('¡Las cámaras del piso 4 se acaban de encender solas!', 'Clara', { thought: true });
            await g.cctv();
            await g.say('Las cerré lo más rápido que pude... El corazón me late con una fuerza que me ahoga.', 'Clara', { thought: true });
          } else {
            // =========================================================
            // OPCIÓN A: DESOBEDECER Y MIRAR EL PISO 4
            // =========================================================
            g.remember('choice1', 'A');
            g.cctvState = { cam4On: true, cam4Ghost: true };
            await g.cctv();
            audio.screech();
            g.flash(0.9);
            g.shakeCam(1.1);
            hospital.blackout(3.5);
            await g.say('¡DIOS MÍO! ¡Hay alguien parado en el medio del pasillo del piso 4 mirando fijo hacia la cámara!', 'Clara');
            await g.sleep(1.5);
            await g.say('Se cortó la luz de la recepción... Tengo que calmarme... Respira hondo, Clara.', 'Clara', { thought: true });
          }

          g.removeObj('monitor_cctv');
          g.cine(false);
          await g.sleep(1.0);
          await g.say('Las primeras horas de guardia pasaron con una lentitud desesperante...', 'Clara', { thought: true });
          await g.fade(1, 1.6);
        }
      });

      await game.waitUse('monitor_cctv');
    }
  },

  // =========================================================================
  // CAPÍTULO 2: LA PRESENCIA
  // =========================================================================
  {
    title: 'Capítulo 2: La Presencia',
    sub: 'Llamadas en la oscuridad',
    startFloor: 1,
    start: [4.2, 6.0, Math.PI / 2],
    async run(game) {
      const { hospital, audio } = game;
      hospital.setLights(true);
      game.ambient(2);

      await game.title('CAPÍTULO 2', 'LA PRESENCIA', 'Hospital San Anselmo · 02:30 AM');
      await game.fade(0, 1.2);

      await game.say('Las noches siguientes comenzaron a volverse una pesadilla despierta...', 'Clara', { thought: true });
      await game.say('Cada madrugada se escuchan pasos pesados arrastrándose por los pasillos vacíos de arriba.', 'Clara', { thought: true });

      // Suena el teléfono de recepción con timbre estridente
      await game.sleep(1.2);
      audio.ring();
      game.objective('Atiende el teléfono de recepción que está sonando');

      // Botiquín de farmacia cerrado con teclado numérico
      let cabinetUnlocked = false;
      game.place({
        id: 'pharmacy_cabinet',
        floor: 1,
        x: 21.5,
        y: 1.2,
        z: 8.5,
        range: 2.4,
        label: 'Armario de medicamentos con clave',
        async onUse(g) {
          if (cabinetUnlocked) {
            await g.say('Ya retiré las pilas de repuesto de este armario.', 'Clara', { thought: true });
            return;
          }
          await g.say('Tiene un teclado de seguridad numérico de 4 dígitos...', 'Clara', { thought: true });
          const ok = await g.keypad('1984');
          if (ok) {
            cabinetUnlocked = true;
            g.giveFlashlight();
            audio.pickup();
            await g.say('¡Se abrió! Encontré una linterna metálica pesada y pilas nuevas.', 'Clara', { thought: true });
            g.removeObj('pharmacy_cabinet');
          }
        }
      });

      let phoneUsed = false;
      const phone = game.place({
        id: 'phone_desk',
        floor: 1,
        x: 3.6,
        y: 1.15,
        z: 6.4,
        range: 3.2,
        label: 'Teléfono de recepción',
        async onUse(g) {
          if (phoneUsed) return;
          phoneUsed = true;
          audio.pickupPhone();
          g.cine(true);

          await g.say('Hospital San Anselmo, recepción nocturna. ¿Hola?... ¿Quién llama?', 'Clara');
          audio.breath(3.5);
          await g.sleep(3.6);
          await g.say('¿Hola? ¿Hay algún enfermero en la línea?... Puedo escuchar que alguien respira.', 'Clara');
          audio.cry(2.5);
          await g.sleep(2.5);
          await g.say('...¿Por qué me encerraron?... Me falta el aire... me falta el aire...', 'Voz infantil', { thought: true });
          audio.thump();
          await g.say('Cortaron... Era la voz de un niño pequeño llorando con desesperación.', 'Clara', { thought: true });
          g.cine(false);
          g.removeObj('phone_desk');

          // Aparición espectral al final del pasillo
          await g.sleep(0.8);
          audio.slam();
          hospital.flicker(2.2);
          g.shakeCam(0.7);

          // Fantasma aparece al final del pasillo llamando con la mano
          const ghost = g.ghost;
          ghost.appear(1, 19.0, 6.0, 'stand', false);
          ghost.pose = 'wave';
          audio.whisper();

          g.objective('Observa la silueta que apareció al final del pasillo');
          await g.lookAt(19.0 * 3, 1.4, 6.0 * 3, 1.2);

          const choice = await g.choice(
            'La pequeña figura espectral al final del pasillo te hace señas insistentes con la mano...',
            'Seguir la figura por el pasillo para averiguar quién es',
            'Ignorarla y quedarte segura dentro del puesto de recepción'
          );

          if (choice === 0) {
            // Opción A: Seguir la figura
            g.remember('choice2', 'A');
            g.objective('Avanza por el pasillo hacia donde estaba la figura');
            await g.say('Tengo que ver de qué se trata... No puedo fingir que no vi nada.', 'Clara', { thought: true });

            // El fantasma retrocede hacia la escalera flotando
            ghost.goTo(24, 6, 2.2, () => {
              ghost.vanish();
            });

            // Ficha médica extraviada en el suelo
            const report = game.place({
              id: 'lost_sheet',
              floor: 1,
              x: 19.0,
              y: 0.05,
              z: 6.0,
              range: 2.2,
              label: 'Hoja médica en el suelo',
              model: noteMesh,
              async onUse(g2) {
                await g2.note(
                  'Ficha Médica Extraviada (Pabellón Pediátrico · 1984)',
                  'Paciente: Gemelos V.\nIngreso judicial confidencial.\n\nObservaciones médicas:\n"El gemelo menor presenta insuficiencia pulmonar y hematomas múltiples.\nEl hermano mayor demuestra una hostilidad patológica hacia su hermano gemelo, con brotes de violencia cada vez que los separan".'
                );
                g2.removeObj('lost_sheet');
              }
            });

            await g.waitUse('lost_sheet');
            hospital.flicker(3.0);
            audio.growl();
            await g.say('La silueta del niño dobló hacia las escaleras y se desvaneció en el aire...', 'Clara', { thought: true });
          } else {
            // Opción B: Quedarse en recepción
            g.remember('choice2', 'B');
            g.objective('Mantente en el puesto de recepción');
            await g.say('Ni loca salgo de aquí sola. Me quedo donde hay luz y teléfono.', 'Clara', { thought: true });
            ghost.vanish();
            await g.sleep(2.0);
            audio.knock();
            await g.say('Se escucharon tres golpes secos contra el vidrio blindado de recepción...', 'Clara', { thought: true });
            await g.say('Luego volvió un silencio sepulcral.', 'Clara', { thought: true });
          }

          await g.sleep(1.0);
          await g.say('El turno concluyó sin que pudiera volver a conciliar la paz.', 'Clara', { thought: true });
          await g.fade(1, 1.6);
        }
      });

      await game.waitUse('phone_desk');
    }
  },

  // =========================================================================
  // CAPÍTULO 3: LOS EXPEDIENTES
  // =========================================================================
  {
    title: 'Capítulo 3: Los Expedientes',
    sub: 'La puerta prohibida',
    startFloor: 1,
    start: [4.2, 6.0, Math.PI / 2],
    async run(game) {
      const { hospital, audio } = game;
      hospital.setLights(true);
      game.ambient(2);

      await game.title('CAPÍTULO 3', 'LOS EXPEDIENTES', 'Hospital San Anselmo · 03:10 AM');
      await game.fade(0, 1.2);

      await game.say('Al tomar la guardia encontré algo brillante asomándose bajo el teclado...', 'Clara', { thought: true });

      // Llave del archivo clínico bajo el teclado
      game.place({
        id: 'desk_keys',
        floor: 1,
        x: 3.6,
        y: 1.12,
        z: 5.7,
        range: 3.2,
        label: 'Llave antigua oxidada',
        model: keyMesh,
        spin: true,
        async onUse(g) {
          audio.pickup();
          g.giveFlashlight();
          g.setFlag('has_archive_key');
          g.removeObj('desk_keys');
          await g.say('Es una llave de bronce antigua con una etiqueta que dice "Archivo Clínico".', 'Clara', { thought: true });
          await g.say('Pregunté a las recepcionistas del turno anterior, pero ninguna sabía de la existencia de esta llave.', 'Clara', { thought: true });
          g.objective('Ve al Archivo Clínico en el pasillo norte (Piso 1) e investiga');
        }
      });

      // Cerradura del archivo clínico
      game.lockHandlers['archive'] = async (door) => {
        if (game.flags['has_archive_key']) {
          audio.door();
          return true;
        } else {
          audio.locked();
          await game.say('Está cerrado con llave pesada. Debe corresponder al Archivo Clínico.', 'Clara', { thought: true });
          return false;
        }
      };

      // Expediente clasificado en el escritorio del archivo
      game.place({
        id: 'archive_folder',
        floor: 1,
        x: 17.0,
        y: 0.82,
        z: 2.4,
        range: 2.4,
        label: 'Expediente médico clasificado',
        model: noteMesh,
        async onUse(g) {
          audio.paper();
          await g.note(
            'Expediente Clasificado · Caso Gemelos Valenzuela',
            'Fecha de Ingreso: 14 de Noviembre de 1984.\nDiagnóstico: Trastorno disociativo severo y dependencia psicopática.\n\n[VARIAS HOJAS FUERON ARRANCADAS CON VIOLENCIA]\n\nAl dorso de la última hoja, alguien escribió con letras temblorosas:\n"NO DEJEN QUE VUELVAN A ENCONTRARSE. POR NADA DEL MUNDO ABRAN LA HABITACIÓN DEL CUARTO PISO".'
          );

          g.setFlag('has_forbidden_key');
          await g.say('¡Había otra llave de hierro pesada dentro del sobre!... Es la llave de la habitación prohibida del Piso 4.', 'Clara', { thought: true });

          const choice = await g.choice(
            'Tienes en tus manos la llave de la habitación sellada del cuarto piso...',
            'Subir ahora mismo al cuarto piso y abrir la puerta prohibida',
            'Esperar y recabar más información antes de cometer una locura'
          );

          if (choice === 0) {
            // Opción A: Subir de inmediato
            g.remember('choice3', 'A');
            await g.say('No puedo soportar esta incertidumbre. Voy a subir ahora mismo.', 'Clara', { thought: true });
            hospital.flicker(3.0);
            audio.screech();
            g.shakeCam(1.0);
            await g.say('¡Una ráfaga de aire helado bajó de golpe por el hueco de las escaleras!', 'Clara', { thought: true });
          } else {
            // Opción B: Esperar e investigar más
            g.remember('choice3', 'B');
            await g.say('Es demasiado peligroso subir sola de noche sin saber a qué me enfrento.', 'Clara', { thought: true });
          }

          // Pesadilla del niño ensangrentado en el pasillo
          await g.fade(1, 1.6);
          g.cine(true);
          await g.sleep(1.0);
          audio.cry(4);
          audio.thump();
          await g.say('Esa noche tuve una pesadilla asfixiante...', 'Clara', { thought: true });
          await g.say('Un niño de rodillas bañado en sangre lloraba desconsolado en medio del pasillo...', 'Clara', { thought: true });
          await g.say('Y alrededor, sombras de médicos corrían gritando en medio del caos.', 'Clara', { thought: true });

          // Despertar al terminar el turno
          await g.fade(0, 1.2);
          g.cine(false);
          await g.lookAt(3.6 * 3, 1.15, 6.0 * 3, 1.0);
          await g.say('Al terminar el turno me senté a firmar el libro de guardia...', 'Clara', { thought: true });
          await g.say('¡Mi felpón negro! El marcador permanente que siempre dejo en el lapicero... ¡no está!', 'Clara');
          await g.say('Hay un círculo de tinta negra fresca en la madera... Alguien me lo robó mientras dormitaba.', 'Clara', { thought: true });

          await g.fade(1, 1.6);
          g.finish();
        }
      });

      await game.waitUse('desk_keys');
    }
  },

  // =========================================================================
  // CAPÍTULO 4: EL ÚLTIMO PISO
  // =========================================================================
  {
    title: 'Capítulo 4: El Último Piso',
    sub: 'El mensaje en la pared',
    startFloor: 1,
    start: [4.2, 6.0, Math.PI / 2],
    async run(game) {
      const { hospital, audio } = game;
      hospital.setLights(true);
      game.ambient(3);
      game.giveFlashlight();

      await game.title('CAPÍTULO 4', 'EL ÚLTIMO PISO', 'Hospital San Anselmo · 03:00 AM');
      await game.fade(0, 1.2);

      await game.say('Al entrar a la guardia el monitor de la Cámara 4 estaba encendido...', 'Clara', { thought: true });
      game.objective('Observa la cámara del piso 4 en el monitor');

      // Interacción obligatoria con CCTV mostrando el graffiti del felpón
      game.cctvState = { cam4On: true, cam4Writing: true };
      await game.cctv();

      await game.say('¡Dios mío! En la pared del pasillo del cuarto piso hay algo escrito...', 'Clara', { thought: true });
      await game.say('Dice en letras gigantescas: "AYÚDALO"... ¡Y está escrito con mi felpón negro robado!', 'Clara');

      const choice = await game.choice(
        'El mensaje "AYÚDALO" fue pintado en la pared del cuarto piso clausurado...',
        'Subir sola al último piso con la linterna a examinar la pared',
        'Llamar al guardia de seguridad para que suba a inspeccionar'
      );

      if (choice === 1) {
        // Opción B: Llamar al guardia Raúl
        game.remember('choice4', 'B');
        await game.say('Voy a llamar a seguridad. No pienso subir sola a ese piso.', 'Clara', { thought: true });
        audio.pickupPhone();
        await game.sleep(1.0);
        await game.say('¿Raúl? Por favor, sube urgente al piso 4... Hay un mensaje pintado en la pared.', 'Clara');

        // Aparece el guardia Raúl
        const guard = game.actor('guard', 'guard');
        guard.place(1, 0, 6, -Math.PI / 2);
        await game.walk(guard, 3.0, 6.0, 2.0);
        await game.say('Tranquila, Clara. Subiré de inmediato a revisar. Quédate en tu puesto.', 'Guardia Raúl');

        // El guardia sube las escaleras
        await game.walk(guard, 25, 6, 2.8);
        guard.hide();

        game.objective('Espera a que el guardia baje del cuarto piso');
        await game.sleep(3.8);
        audio.door();

        // El guardia regresa
        guard.place(1, 24, 6, Math.PI / 2);
        await game.walk(guard, 3.5, 6.0, 2.6);
        await game.say('Revisé todo el pasillo del piso 4 de punta a punta, Clara.', 'Guardia Raúl');
        await game.say('Las paredes están limpias y la puerta de hierro sigue con candado oxidado.', 'Guardia Raúl');
        await game.say('No hay ningún mensaje. Estás haciendo demasiadas guardias de noche... necesitas descansar.', 'Guardia Raúl');
        await game.walk(guard, 0, 6, 2.0);
        guard.hide();

        await game.say('Pero yo lo vi con mis propios ojos... ¡Sé perfectamente lo que apareció en la pantalla!', 'Clara', { thought: true });
      } else {
        // Opción A: Subir sola al piso 4
        game.remember('choice4', 'A');
        game.objective('Sube las escaleras hasta el Piso 4 e inspecciona el pasillo');
        await game.say('Voy a subir yo misma. Tengo que comprobarlo con mis propios ojos.', 'Clara', { thought: true });

        // Permitir subir escaleras
        game.stairsBlocked = false;
        await game.until(() => hospital.floorNum === 4);

        // Mostrar el decal "AYÚDALO" en el piso 4
        hospital.showDecal('help', true);
        hospital.flicker(2.2);
        audio.whisper();
        await game.say('¡Aquí está! "AYÚDALO"... ¡La tinta del marcador negro todavía está fresca y goteando!', 'Clara', { thought: true });
        audio.screech();
        game.shakeCam(0.9);
        await game.say('¡Alguien golpeó salvajemente desde el otro lado de la puerta prohibida! ¡Tengo que bajar ya!', 'Clara', { thought: true });
      }

      await game.sleep(1.0);
      await game.fade(1, 1.6);
      game.finish();
    }
  },

  // =========================================================================
  // CAPÍTULO 5: EL FINAL (CLÍMAX, REVELACIÓN Y BUCLE)
  // =========================================================================
  {
    title: 'Capítulo 5: El Final',
    sub: 'La verdad de los gemelos',
    startFloor: 1,
    start: [4.2, 6.0, Math.PI / 2],
    async run(game) {
      const { hospital, audio } = game;
      hospital.setLights(true);
      game.ambient(3);
      game.giveFlashlight();

      await game.title('CAPÍTULO 5', 'EL FINAL', 'Hospital San Anselmo · 03:33 AM');
      await game.fade(0, 1.2);

      await game.say('Ya no puedo distinguir qué es real y qué es una pesadilla de la vigilia...', 'Clara', { thought: true });

      // Expediente completo y fotografía en el mostrador
      game.place({
        id: 'final_dossier',
        floor: 1,
        x: 3.6,
        y: 1.15,
        z: 6.0,
        range: 3.2,
        label: 'Expediente completo y fotografía polaroid',
        model: photoMesh,
        async onUse(g) {
          audio.paper();
          await g.note(
            'Expediente Forense Secreto · Gemelos Valenzuela',
            'FOTOGRAFÍA ADJUNTA: Dos niños gemelos idénticos en 1984.\nUno de ellos luce pálido, débil y conectado a un tubo de oxígeno...\n\nINFORME PERICIAL:\n"El gemelo enfermo falleció por asfixia mecánica en su cama. Su hermano sano lo asfixió con una almohada durante la medianoche.\nLa adinerada familia Valenzuela pagó una fortuna a la directiva para encubrir el homicidio.\nEncerraron al hermano asesino de por vida en la habitación 401 del cuarto piso clausurado.\nNadie fuera de estas cuatro paredes supo jamás cuál de los dos niños murió y cuál quedó encerrado".'
          );

          g.removeObj('final_dossier');
          g.cine(true);

          await g.say('Dios mío del cielo... ¡El hermano que está encerrado arriba fue quien mató a su propio gemelo!', 'Clara');
          await g.say('Y el fantasma que me llama... ¡es el hermano que murió! Él no sabe que su propio gemelo lo asesinó...', 'Clara');
          await g.say('Piensa que su hermano sigue atrapado inocente... ¡por eso me suplicaba que lo ayudara!', 'Clara');

          // APAGÓN TOTAL DEL HOSPITAL Y ALARMAS
          audio.slam();
          audio.screech();
          g.flash(1.0);
          g.shakeCam(1.1);
          hospital.blackout(999);
          hospital.ambient.intensity = 0.35;

          await g.say('¡Se cortó la luz de todo el hospital!', 'Clara');
          const ghost = g.ghost;
          ghost.appear(1, 6.0, 6.0, 'chase', false);
          audio.growl();

          g.cine(false);
          g.stairsBlocked = false;
          g.objective('¡Huye por las escaleras y sube al Piso 4!');

          // QTE 1: Silla de ruedas rodando descontrolada en piso 2
          await g.until(() => hospital.floorNum === 2);
          audio.thump();
          const qte1 = await g.qte('KeyA', '¡ESQUIVA LA SILLA DE RUEDAS! [A]', 1800);
          if (!qte1) {
            audio.screech();
            g.shakeCam(0.85);
            await g.say('¡Casi me embiste en la oscuridad!', 'Clara', { thought: true });
          } else {
            audio.ding();
          }

          // QTE 2: Camilla que se precipita en piso 3
          await g.until(() => hospital.floorNum === 3);
          audio.slam();
          const qte2 = await g.qte('KeyD', '¡ESQUIVA LA CAMILLA! [D]', 1800);
          if (!qte2) {
            audio.screech();
            g.shakeCam(0.85);
          } else {
            audio.ding();
          }

          // Llegada al Piso 4
          await g.until(() => hospital.floorNum === 4);
          ghost.vanish();
          hospital.showDecal('help', true);
          g.objective('Abre la habitación 401 al final del pasillo con la llave');

          // Puerta prohibida de la celda 401
          const forbiddenDoor = hospital.doors.get('5,6');
          if (forbiddenDoor) {
            forbiddenDoor.lock = null;
          }

          await g.until(() => forbiddenDoor && forbiddenDoor.open);

          // Clímax: El hermano loco ataca con el bisturí
          g.cine(true);
          const brother = g.actor('brother', 'brother');
          brother.place(4, 3.0, 6.0, Math.PI / 2);
          brother.pose = 'reach';

          audio.screech();
          g.shakeCam(1.3);
          g.flash(0.95);

          // QTE final para esquivar el ataque del bisturí
          const dodge = await g.qte('Space', '¡ESQUIVA EL ATAQUE CON EL BISTURÍ! [ESPACIO]', 1600);
          if (dodge) audio.ding(); else audio.thump();

          await g.say('¡Un hombre demacrado se abalanzó sobre mí empuñando un bisturí quirúrgico!', 'Clara');
          await g.say('Logré apartarme en el último segundo y tropezó de bruces contra las baldosas.', 'Clara', { thought: true });

          brother.pose = 'cower';
          await g.say('No... no... ¡el cuello frío!... ¡Mamá me encerró!... ¡Él no respira!...', 'Hermano asesino');
          await g.say('¡Él era el preferido de mamá!... ¡Le puse la almohada en la cara para que se callara!', 'Hermano asesino');

          // Clara revela la terrible verdad
          await g.say('¡Tus padres te encerraron aquí porque sabían que eras un asesino!', 'Clara');
          await g.say('¡Pero tu hermano nunca lo supo! ¡Él me trajo hasta aquí porque pensaba que eras una víctima inocente y quería salvarte!', 'Clara');

          // El fantasma del gemelo muerto entra a la habitación
          ghost.appear(4, 5.5, 6.0, 'stand', false);
          audio.cry(2.2);
          await g.sleep(2.2);
          audio.screech();
          audio.growl();
          g.flash(1.0);
          g.shakeCam(1.3);

          await g.say('El fantasma del niño miró a su hermano... y la infinita tristeza se convirtió en una furia infernal.', 'Clara', { thought: true });
          await g.say('El espíritu se arrojó sobre su hermano asesino en un remolino de sombras y gritos.', 'Clara', { thought: true });
          await g.say('¡La puerta de salida de emergencia está abierta! ¡Corre, Clara!', 'Clara', { thought: true });

          // Escape final
          await g.fade(1, 2.2);
          brother.hide();
          ghost.vanish();

          // Epílogo del bucle eterno
          await g.sleep(2.0);
          await g.say('Amaneció. Salí corriendo del hospital a la calle y jamás volví a mirar hacia atrás.', 'Clara');
          await g.say('La policía intervino el San Anselmo y clausuró el hospital definitivamente.', 'Clara');
          await g.say('Pero a veces, en mitad de la noche, me pregunto si esta pesadilla alguna vez terminará...', 'Clara');

          // Cinemática final del bucle temporal
          await g.sleep(1.5);
          await g.title('EPÍLOGO', 'EL BUCLE ETERNO', 'Hospital San Anselmo · 23:55 PM');
          await g.say('Una nueva recepcionista novata cruza la puerta giratoria para su primer turno de noche...', 'Voz en off');
          await g.say('Y la recepcionista saliente le entrega las llaves y le susurra: "Hay una sola regla... Nunca mires las cámaras del último piso...".', 'Voz en off');

          await g.fade(1, 2.5);
          g.finish();
        }
      });

      await game.waitUse('final_dossier');
    }
  }
];
