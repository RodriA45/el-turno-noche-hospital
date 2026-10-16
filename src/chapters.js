import { PEOPLE, noteMesh, keyMesh, flashlightMesh, batteryMesh, markerMesh, photoMesh } from './world/Models.js';
import { createDetailedKey, createDetailedPolaroid, createDetailedFlashlight } from './ui/ObjectExaminer.js';

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

      // Compañeras de turno paradas frente al mostrador de recepción (visibles y orientadas hacia Clara)
      const marta = game.actor('marta', 'marta');
      marta.place(1, 2.7, 5.5, Math.PI / 2);
      const silvia = game.actor('silvia', 'silvia');
      silvia.place(1, 2.7, 6.5, Math.PI / 2);

      await game.title('CAPÍTULO 1', 'PRIMER TURNO', 'Hospital San Anselmo · 23:55 PM');
      await game.fade(0, 1.2);
      game.cine(true);

      // Cámara enfoca a las compañeras a la altura de los ojos sobre el mostrador
      await game.lookAt(2.7 * 3, 1.55, 6.0 * 3, 1.0);
      await game.say('Clara, bienvenida formalmente al turno noche del San Anselmo.', 'Marta');
      await game.say('El hospital es de los años 50. Los pisos crujen con el viento, pero los pacientes de planta baja duermen temprano.', 'Marta');
      await game.say('En el escritorio te dejamos el libro de registro de guardia, los reportes médicos y las llaves comunes.', 'Silvia');
      await game.say('Pero antes de irnos a descansar... hay una regla inquebrantable en este turno.', 'Silvia');
      await game.say('¿Una regla?... ¿De qué se trata?', 'Clara', { thought: true });
      await game.say('NUNCA mires las cámaras del último piso. El piso 4 está completamente clausurado y fuera de servicio.', 'Silvia');
      await game.say('¿Por qué? ¿Qué ocurrió en ese piso?', 'Clara');
      await game.say('La última recepcionista que estuvo en tu lugar, Andrea... las miró durante una madrugada.', 'Marta');

      // FLASHBACK CINEMATOGRÁFICO VHS DE ANDREA EN EL PISO 4
      await game.flashback('andrea', {
        title: 'EXPEDIENTE POLICIAL #84-C · INCIDENTE CUARTO PISO',
        date: 'OCT 14 1984 · 04:12:08 AM',
        location: 'PISO 4 — CLAUSURADO TRAS LA TRAGEDIA',
      }, 5.5);

      await game.lookAt(2.7 * 3, 1.55, 6.0 * 3, 0.4);
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

      // Cerrar y bloquear la puerta de salida exterior
      const exitDoor = hospital.doorAt(0, 6);
      if (exitDoor) {
        exitDoor.open = false;
        exitDoor.lock = 'front';
      }
      game.lockHandlers['front'] = async () => {
        game.audio.locked();
        await game.say('Marta y Silvia cerraron la salida con llave desde afuera. No puedo salir hasta que termine mi turno a las 7:00 AM.', 'Clara', { thought: true });
        return false;
      };

      game.cine(false);
      game.objective('Lee el libro de guardia y accede a los monitores de seguridad (CCTV)');

      // Libro de registro sobre el mostrador para ambientación
      let logbookRead = false;
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
          logbookRead = true;
          await g.note(
            'Libro de Guardia · Hospital San Anselmo',
            'Últimas anotaciones:\n\n- 08/Oct: Ruido de pasos arrastrándose en el cielo raso sobre el pasillo norte. No hay pacientes en esa ala.\n\n- 11/Oct: La recepcionista Andrea reporta interferencias en los monitores y olor a humedad estancada.\n\n- 12/Oct: [PÁGINA MANCHADA] "Alguien me robó el marcador del escritorio. Sé que alguien entra a la recepción mientras bajo la vista".\n\n- REPORTE DE HOY: Se reportaron 3 anomalías visuales en las cámaras de PB, Piso 1 y Piso 2. Verificar antes de cerrar la primera hora.'
          );
          if (!cctvCompleted) {
            await g.say('El reporte indica que debo verificar 3 anomalías en las cámaras de seguridad...', 'Clara', { thought: true });
          } else {
            await g.say('Las anotaciones del turno... Andrea tenía razón, hay una presencia en el hospital.', 'Clara', { thought: true });
          }
        }
      });

      // Pilas de repuesto sobre el mostrador de recepción
      game.place({
        id: 'battery_reception',
        floor: 1,
        x: 3.6,
        y: 1.14,
        z: 7.2,
        range: 2.6,
        label: 'Pilas AA de repuesto',
        model: batteryMesh,
        spin: true,
        async onUse(g) {
          g.giveBattery(0.5);
          g.removeObj('battery_reception');
          await g.say('Encontré pilas de repuesto. Me servirán para mantener la linterna encendida.', 'Clara', { thought: true });
        }
      });

      // Monitor de seguridad en el mostrador estilo FNAF
      let cctvCompleted = false;
      game.place({
        id: 'monitor_cctv',
        floor: 1,
        x: 3.6,
        y: 1.15,
        z: 6.0,
        range: 3.2,
        label: 'Consola de Monitores CCTV [FNAF]',
        async onUse(g) {
          if (cctvCompleted) {
            await g.say('El sistema de cámaras sufrió un colapso eléctrico total.', 'Clara', { thought: true });
            return;
          }

          g.objective(g.input.isTouch ? 'Localiza las 3 anomalías en las cámaras (Toca "Iluminar Sector")' : 'Localiza las 3 anomalías en las cámaras del hospital (Usa Espacio para iluminar)');

          // Abrir la tableta de vigilancia estilo FNAF
          const cctvResult = await g.cctv({
            targetAnomalies: ['child_waiting', 'wheelchair_moved', 'door_peek'],
            async onAnomalyFound(anomaly, currentCount, totalCount) {
              if (anomaly.id === 'wheelchair_moved') {
                await g.say('¡Espera!... Esa silla de ruedas estaba frenada contra la pared. Se movió al medio del pasillo sola.', 'Clara', { thought: true });
              } else if (anomaly.id === 'door_peek') {
                await g.say('La puerta de la habitación clausurada 204 se abrió... Hay una silueta pálida espiando.', 'Clara', { thought: true });
              } else if (anomaly.id === 'child_waiting') {
                await g.say('¡Dios mío!... Hay un niño empapado sentado en la sala de espera de mi propia recepción.', 'Clara', { thought: true });
              }
              if (currentCount >= totalCount) {
                await g.sleep(0.4);
                await g.say('¡Identifiqué las 3 anomalías! Pero... ¿por qué suena esa alarma en el Piso 4 clausurado?', 'Clara', { thought: true });
              }
            },
            onClimaxTrigger() {
              g.objective('¡PELIGRO! Revisa de inmediato la CAM 05 del Piso 4 en la consola');
            }
          });

          // Si el jugador vio el jumpscare o completó la inspección
          cctvCompleted = true;
          g.removeObj('monitor_cctv');

          // ===================================================================
          // SECUENCIA DE CORTE DE LUZ Y SUPERVIVENCIA EN 3D
          // ===================================================================
          g.cine(true);
          hospital.blackout(20);
          audio.screech();
          g.shakeCam(1.3);
          audio.slam();

          await g.say('¡SE CORTÓ LA LUZ GENERAL DE TODA LA PLANTA BAJA!', 'Clara');
          await g.sleep(1.0);
          audio.thump();
          await g.say('Acabo de escuchar cómo se abrió la puerta pesada de las escaleras... Esa cosa que vi en la cámara del piso 4... ¡acaba de bajar!', 'Clara', { thought: true });
          g.cine(false);

          // Linterna de emergencia colocada en el casillero de la pared este de recepción (7.8, 4.2)
          let hasFlashlight = false;
          game.place({
            id: 'emergency_flashlight',
            floor: 1,
            x: 7.2,
            y: 1.15,
            z: 4.2,
            range: 2.8,
            label: 'Linterna de emergencia (Luz fosforescente)',
            model: flashlightMesh,
            spin: true,
            async onUse(g2) {
              if (hasFlashlight) return;
              hasFlashlight = true;
              audio.pickup();
              g2.giveFlashlight();
              g2.removeObj('emergency_flashlight');
              await g2.examineItem({
                title: 'LINTERNA INDUSTRIAL',
                sub: 'Modelo táctico pesado · Hospital San Anselmo',
                desc: 'Una sólida linterna de patrulla fabricada en aluminio anodizado y óptica estriada. Pulsa [F] para encender el haz de luz durante la guardia.',
                model: createDetailedFlashlight
              });
              await g2.say(g2.input.isTouch ? '¡La encontré! Es metálica y pesada. Toca el botón de linterna para encenderla.' : '¡La encontré! Es metálica y pesada. Pulsa F para encenderla.', 'Clara', { thought: true });
            }
          });

          game.objective('Recoge la linterna de emergencia en el casillero de la pared tras el mostrador');
          await game.waitUse('emergency_flashlight');

          // Pasos aproximándose por el pasillo a oscuras
          await game.sleep(0.8);
          audio.whisper();
          audio.step(0.4);
          hospital.flicker(1.5);

          // Fantasma aparece al final del pasillo y avanza hacia recepción
          const ghost = game.ghost;
          ghost.appear(1, 16.0, 6.0, 'stand', false);
          ghost.goTo(7.5, 6.0, 1.3);

          game.objective(game.input.isTouch ? '¡VIENE HACIA AQUÍ! ¡ESCÓNDETE EN EL CASILLERO Y TOCA LA PANTALLA PARA CONTENER EL ALIENTO!' : '¡VIENE HACIA AQUÍ! ¡ESCÓNDETE EN EL CASILLERO CON [E] Y CONTÉN LA RESPIRACIÓN [ESPACIO]!');
          await game.say(game.input.isTouch ? '¡Viene arrastrando los pies hacia la recepción! ¡Tengo que meterme en el casillero YA y contener el aliento tocando la pantalla!' : '¡Viene arrastrando los pies hacia la recepción! ¡Tengo que meterme en el casillero YA y contener el aliento!', 'Clara', { thought: true });

          // Período de acecho: evaluar si Clara se esconde y contiene la respiración
          let spotted = false;
          const waitStart = performance.now();
          while (performance.now() - waitStart < 6200) {
            await game.sleep(0.25);
            // Cuando el fantasma llega cerca de recepción y los casilleros (x < 11.5)
            if (ghost.pos.x < 11.5 * 3) {
              if (!game.isHiding) {
                spotted = true;
                break;
              } else if (game.gaspCd > 0 || !game.holdingBreath) {
                spotted = true;
                break;
              }
            }
          }

          if (spotted) {
            // El ente detecta el ruido/respiración o ve a Clara descubierta
            audio.screech();
            audio.slam();
            game.shakeCam(1.3);
            game.flash(0.85);

            if (game.isHiding) {
              await game.say('¡ME ESCUCHÓ RESPIRAR! ¡ESTÁ FORZANDO LA PUERTA DEL CASILLERO!', 'Clara');
              const qteOk = await game.qte('Space', game.input.isTouch ? '¡SUJETA LA PUERTA CON FUERZA! [TOCA AQUÍ]' : '¡SUJETA LA PUERTA CON FUERZA! [ESPACIO]', 1800);
              if (qteOk) {
                audio.slam();
                audio.ding();
                await game.say('¡Ufff!... Logré trabar la puerta con el hombro. El ente gruñó y se alejó por el pasillo.', 'Clara', { thought: true });
              } else {
                audio.screech();
                audio.thump();
                game.shakeCam(1.5);
                await game.say('¡La puerta se abrió violentamente! Apenas logré agacharme y esquivarlo por centímetros.', 'Clara', { thought: true });
              }
            } else {
              await game.say('¡ME VIO! ¡NO ALCANCÉ A METERME EN EL CASILLERO!', 'Clara');
              const qteDodge = await game.qte('KeyA', game.input.isTouch ? '¡ESQUIVA A LA IZQUIERDA! [TOCA AQUÍ]' : '¡ESQUIVA A LA IZQUIERDA DETRÁS DEL MOSTRADOR! [A]', 1700);
              if (qteDodge) {
                audio.slam();
                audio.ding();
                await game.say('¡Salté detrás del mostrador! La sombra pasó de largo en la oscuridad.', 'Clara', { thought: true });
              } else {
                audio.screech();
                audio.thump();
                game.shakeCam(1.5);
              }
            }
          } else {
            // Sigilo perfecto y respiración contenida
            audio.breath(2.2);
            await game.say('Pasó justo frente a las rejillas del casillero... Pude escuchar su respiración congelada.', 'Clara', { thought: true });
          }

          ghost.goTo(0, 6, 1.8, () => {
            ghost.vanish();
          });

          await game.sleep(2.0);
          if (game.isHiding) game.exitHiding();

          // Se restablece la luz de emergencia tenue
          hospital.flicker(2.5);
          hospital.setLights(true);
          await game.say('Se fue hacia las salas clausuradas del ala este... El corazón me late a mil.', 'Clara', { thought: true });
          await game.say('Sobreviví a mi primera hora en el San Anselmo... pero todavía quedan cinco horas para el amanecer.', 'Clara', { thought: true });

          await game.sleep(1.0);
          await game.fade(1, 1.6);
          game.finish();
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
      game.objective('Atiende el teléfono de recepción que está sonando con urgencia');

      // Botiquín de farmacia cerrado con teclado numérico (21.5, 8.5)
      let cabinetUnlocked = false;
      game.place({
        id: 'pharmacy_cabinet',
        floor: 1,
        x: 21.5,
        y: 1.2,
        z: 8.5,
        range: 2.6,
        label: 'Armario de medicamentos con cerradura digital',
        async onUse(g) {
          if (cabinetUnlocked) {
            await g.say('Ya retiré los medicamentos y las pilas de repuesto de este armario.', 'Clara', { thought: true });
            return;
          }
          await g.say('El armario tiene un teclado numérico de seguridad de 4 dígitos...', 'Clara', { thought: true });
          const ok = await g.keypad('1984');
          if (ok) {
            cabinetUnlocked = true;
            g.giveBattery(1.0);
            await g.say('¡Código correcto! Encontré pilas nuevas de alta duración y un informe pediátrico.', 'Clara', { thought: true });
            g.removeObj('pharmacy_cabinet');
            g.setFlag('cabinet_done');
          }
        }
      });

      // Carpeta de turnos en el escritorio de farmacia (21.5, 1.4)
      game.place({
        id: 'nurse_clipboard',
        floor: 1,
        x: 21.3,
        y: 1.1,
        z: 2.0,
        range: 2.4,
        label: 'Prontuario de guardia de enfermería',
        model: noteMesh,
        async onUse(g) {
          audio.paper();
          await g.note(
            'Prontuario de Enfermería · Sector Farmacia',
            'Recordatorio a las enfermeras de noche:\n\n"La clave del armario de narcóticos y linternas corresponde al año de ingreso judicial del caso Valenzuela (1984).\n\nNo dejar medicamentos al alcance de pacientes desorientados".'
          );
          await g.say('¡Aquí está la clave del armario! Es el año de ingreso judicial: 1984.', 'Clara', { thought: true });
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

          // FLASHBACK CINEMATOGRÁFICO VHS: CÁMARA EXTERIOR EN LA TORMENTA Y LA SOMBRA EN LA CABINA
          await g.flashback('phone_rain', {
            title: 'CÁMARA EXTERIOR · ACCESO DE AMBULANCIAS',
            date: 'OCT 14 · 02:30:42 AM',
            location: 'CABINA TELEFÓNICA PÚBLICA · LLUVIA TORRENCIAL',
          }, 5.5);

          audio.thump();
          await g.say('Cortaron... En el visor de la centralita dice: "Llamada interna desde Sector Farmacia (Ala Este)".', 'Clara', { thought: true });
          g.cine(false);
          g.removeObj('phone_desk');

          g.objective('Ve al Sector Farmacia al final del pasillo norte y busca medicación y pilas');
          await g.say('Tengo que ir a la Farmacia a revisar de dónde provino la llamada y conseguir pilas de repuesto.', 'Clara', { thought: true });

          // Esperar a que Clara abra el armario de la farmacia
          await g.until(() => g.flags['cabinet_done']);

          // SECUENCIA DE REGRESO: QTE DE CAMILLA / SILLA DE RUEDAS EN EL PASILLO
          hospital.flicker(2.5);
          audio.slam();
          g.shakeCam(0.8);
          await g.say('¡¿Qué fue ese estruendo en el pasillo principal?!', 'Clara', { thought: true });
          g.objective('Regresa hacia la recepción');

          // Al acercarse al pasillo central (x < 14)
          await g.until(() => g.player.pos.x < 14.0 * 3);

          audio.screech();
          g.shakeCam(1.1);
          // QTE: Esquivar la camilla que sale disparada sola por el pasillo
          const qteOk = await g.qte('KeyA', '¡UNA CAMILLA VIENE HACIA TI! ¡ESQUIVA A LA IZQUIERDA!');
          if (qteOk) {
            audio.thump();
            await g.say('¡Ufff!... Salté justo a tiempo... La camilla se estrelló contra los casilleros de metal.', 'Clara', { thought: true });
          } else {
            audio.thump();
            g.shakeCam(1.4);
            await g.say('¡Maldición! El borde de la camilla me golpeó el hombro... Alguien la empujó con fuerza inhumana.', 'Clara', { thought: true });
          }

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
          g.finish();
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
          await g.examineItem({
            title: 'LLAVE ANTIGUA DE BRONCE',
            sub: 'Sector Archivo Clínico · Hospital San Anselmo',
            desc: 'Una pesada llave de latón labrada a mano. Cuelga de una chapa metálica estampada donde se distingue el sello del hospital y la numeración grabada: "Nº 0315". Rota el modelo para examinarla en 360°.',
            model: () => createDetailedKey('0315')
          });
          await g.say('Es una llave de bronce antigua con una chapa que dice "Archivo Clínico" y el número troquelado 0315.', 'Clara', { thought: true });
          await g.say('Pregunté a las recepcionistas del turno anterior, pero ninguna sabía de la existencia de esta llave.', 'Clara', { thought: true });
          g.objective('Ve al Archivo Clínico en el pasillo norte (Piso 1) e investiga');
        }
      });

      // Cerradura del archivo clínico
      game.lockHandlers['archive'] = async (door) => {
        if (game.flags['has_archive_key']) {
          return true;
        } else {
          audio.locked();
          await game.say('Está cerrado con llave pesada. Debe corresponder al Archivo Clínico.', 'Clara', { thought: true });
          return false;
        }
      };

      // Pilas en el archivo clínico
      game.place({
        id: 'battery_archive',
        floor: 1,
        x: 16.8,
        y: 0.85,
        z: 3.6,
        range: 2.4,
        label: 'Pilas AA selladas',
        model: batteryMesh,
        spin: true,
        async onUse(g) {
          g.giveBattery(0.6);
          g.removeObj('battery_archive');
          await g.say('Pilas alcalinas en el archivo. La linterna vuelve a tener carga completa.', 'Clara', { thought: true });
        }
      });

      // Memorándum con pista de la combinación del archivador
      game.place({
        id: 'archive_memo',
        floor: 1,
        x: 16.2,
        y: 0.85,
        z: 2.0,
        range: 2.4,
        label: 'Memorándum de clasificación de expedientes',
        model: noteMesh,
        async onUse(g) {
          audio.paper();
          await g.note(
            'Índice de Psiquiatría Forense · Sector Archivo',
            'AVISO DE SEGURIDAD INTERNA:\n\n"Los expedientes correspondientes a homicidios y negligencias graves se encuentran archivados bajo custodia en la gaveta blindada 3.\n\nCódigo de desbloqueo: 0315 (Legajo Valenzuela)".'
          );
          await g.say('El memorándum indica que el código del archivador blindado es 0315.', 'Clara', { thought: true });
        }
      });

      // Archivador blindado con cerradura digital
      let cabinetOpened = false;
      game.place({
        id: 'archive_cabinet',
        floor: 1,
        x: 17.0,
        y: 0.82,
        z: 2.4,
        range: 2.5,
        label: 'Archivador blindado de expedientes restringidos',
        async onUse(g) {
          if (cabinetOpened) {
            await g.say('Ya retiré el expediente y la llave prohibida de este archivador.', 'Clara', { thought: true });
            return;
          }
          await g.say('El archivador metálico tiene un teclado numérico de seguridad...', 'Clara', { thought: true });
          const ok = await g.keypad('0315');
          if (ok) {
            cabinetOpened = true;
            audio.pickup();
            g.removeObj('archive_cabinet');

            await g.note(
              'Expediente Clasificado · Caso Gemelos Valenzuela',
              'Fecha de Ingreso: 14 de Noviembre de 1984.\nDiagnóstico: Trastorno disociativo severo y dependencia psicopática.\n\n[VARIAS HOJAS FUERON ARRANCADAS CON VIOLENCIA]\n\nAl dorso de la última hoja, alguien escribió con letras temblorosas:\n"NO DEJEN QUE VUELVAN A ENCONTRARSE. POR NADA DEL MUNDO ABRAN LA HABITACIÓN DEL CUARTO PISO".'
            );

            // FLASHBACK CINEMATOGRÁFICO VHS: EXPEDIENTE CLÍNICO DE 1984 Y FOTOS DE LOS GEMELOS
            await g.flashback('autopsy', {
              title: 'REGISTRO MÉDICO CONFIDENCIAL #108-B',
              date: 'NOV 14 1984 · 03:15:20 AM',
              location: 'ARCHIVO CLÍNICO RESTRINGIDO',
            }, 5.5);

            g.setFlag('has_forbidden_key');
            await g.say('¡Había otra llave de hierro pesada dentro del sobre!... Es la llave de la habitación prohibida del Piso 4.', 'Clara', { thought: true });

            // CORTE DE LUZ Y SECUENCIA DE SIGILO EN EL ARCHIVO
            audio.spark();
            audio.buzz(1.0);
            hospital.blackout(18);
            audio.whisper();
            g.shakeCam(0.65);
            await g.say('¡Se apagaron las luces del archivo! Y... se escuchan pasos arrastrándose afuera en el pasillo...', 'Clara', { thought: true });

            g.objective('¡APAGA LA LINTERNA [F] Y AGÁCHATE [C]! Una silueta acecha frente al vidrio del archivo');

            // Fantasma camina lentamente por el pasillo frente a la puerta de vidrio del archivo (x: 16, z: 6)
            const shadow = g.ghost;
            shadow.appear(1, 21.0, 6.0, 'stand', false);
            shadow.goTo(11.0, 6.0, 0.9);

            let detectedInArchive = false;
            const checkStart = performance.now();
            while (performance.now() - checkStart < 5000) {
              await g.sleep(0.3);
              if (shadow.pos.x > 13.5 * 3 && shadow.pos.x < 18.5 * 3) {
                if (g.player.flashOn || !g.player.crouch) {
                  detectedInArchive = true;
                  break;
                }
              }
            }

            if (detectedInArchive) {
              // La sombra vio la linterna o la figura de pie a través del vidrio
              audio.screech();
              audio.knock();
              g.shakeCam(1.1);
              await g.say('¡La silueta se detuvo frente al vidrio y forcejeó la puerta!', 'Clara', { thought: true });
              const qteArchive = await g.qte('KeyS', '¡AGÁCHATE DE GOLPE BAJO EL ESCRITORIO! [S]', 1800);
              if (qteArchive) {
                audio.thump();
                audio.ding();
                await g.say('¡Ufff!... Me deslicé bajo el escritorio de metal y aguanté la respiración.', 'Clara', { thought: true });
              } else {
                audio.screech();
                audio.thump();
                g.shakeCam(1.3);
              }
            } else {
              // Sigilo perfecto
              audio.breath(2.2);
              await g.say('La sombra se detuvo un instante ante el vidrio esmerilado... pero al estar a oscuras y agachada, no me vio y siguió de largo.', 'Clara', { thought: true });
            }

            shadow.goTo(6.0, 6.0, 1.6, () => shadow.vanish());
            await g.sleep(2.0);
            hospital.setLights(true);

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
      game.objective('Observa la cámara CAM 05 del piso 4 en el monitor y baja el monitor con [E]');

      // Interacción con CCTV mostrando el graffiti del felpón en CAM 05
      game.cctvState = { cam4On: true, cam4Writing: true };
      await game.cctv({
        startCam: 4,
        targetAnomalies: [],
      });

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

        audio.slam();
        audio.buzz(1.5);
        await game.say('Pero yo lo vi con mis propios ojos en la cámara...', 'Clara', { thought: true });
        await game.say('¡De repente empezó a sonar una chicharra eléctrica en las escaleras! Raúl no vio nada o me mintió.', 'Clara', { thought: true });
        await game.say('Tengo que subir yo misma a comprobarlo.', 'Clara', { thought: true });
      } else {
        // Opción A: Subir de inmediato sola al piso 4
        game.remember('choice4', 'A');
        await game.say('Voy a subir yo misma de inmediato. Tengo que comprobarlo con mis propios ojos.', 'Clara', { thought: true });
      }

      // SUBIDA AL PISO 4 CLAUSURADO
      game.stairsBlocked = false;
      game.objective('Sube por las escaleras hasta el Piso 4 e inspecciona el pasillo');
      await game.until(() => hospital.floorNum === 4);

      // El piso 4 está a oscuras con la línea de potencia cortada
      hospital.setLights(false);
      hospital.ambient.intensity = 0.22;
      await game.say('El aire aquí arriba es gélido... La energía general del piso 4 está cortada.', 'Clara', { thought: true });

      // Pilas industriales en la camilla auxiliar junto a las escaleras
      game.place({
        id: 'battery_floor4',
        floor: 4,
        x: 23.5,
        y: 0.95,
        z: 6.8,
        range: 2.6,
        label: 'Pilas industriales para linterna',
        model: batteryMesh,
        spin: true,
        async onUse(g) {
          g.giveBattery(0.7);
          g.removeObj('battery_floor4');
          await g.say('Encontré pilas alcalinas pesadas. Linterna restaurada al 100%.', 'Clara', { thought: true });
        }
      });

      // Tablero de disyuntores de emergencia del piso 4
      let breakerRestored = false;
      game.place({
        id: 'breaker_panel_4',
        floor: 4,
        x: 21.0,
        y: 1.25,
        z: 5.4,
        range: 2.8,
        label: 'Tablero eléctrico auxiliar del Piso 4',
        async onUse(g) {
          if (breakerRestored) return;
          breakerRestored = true;
          audio.spark();
          audio.buzz(1.2);
          hospital.flicker(2.2);
          hospital.setLights(true);
          hospital.showDecal('help', true);
          g.removeObj('breaker_panel_4');
          await g.say('¡Enganchó el generador auxiliar! Los fluorescentes rojos del pasillo comenzaron a parpadear.', 'Clara', { thought: true });
        }
      });

      game.objective('Restaura los disyuntores en el tablero eléctrico auxiliar (Piso 4)');
      await game.until(() => breakerRestored);

      game.objective('Avanza con cautela por el pasillo e inspecciona la pared norte');
      // Esperar a que Clara avance hacia el decal "AYÚDALO" (x < 15.5)
      await game.until(() => game.player.pos.x < 15.5 * 3);

      audio.whisper();
      await game.say('¡Aquí está!... "AYÚDALO"... ¡La tinta del marcador negro todavía está fresca y goteando!', 'Clara', { thought: true });

      // Clímax aterrador: golpes ensordecedores en la puerta sellada de la habitación 401
      audio.slam();
      audio.screech();
      game.shakeCam(1.35);
      game.flash(0.9);
      await game.say('¡ALGUIEN ESTÁ GOLPEANDO SALVAJEMENTE DESDE EL INTERIOR DE LA PUERTA PROHIBIDA!', 'Clara');

      // Silueta que se proyecta en las rejas
      const stalker = game.actor('stalker', 'brother');
      stalker.place(4, 3.2, 6.0, Math.PI / 2);
      stalker.pose = 'reach';
      audio.growl();

      game.objective('¡HUYE DEL CUARTO PISO! ¡CORRE HACIA LAS ESCALERAS!');
      await game.sleep(0.6);

      // Clara corre hacia las escaleras
      await game.until(() => game.player.pos.x > 18.0 * 3);

      // QTE de escape
      audio.slam();
      game.shakeCam(0.9);
      const escapeQte = await game.qte('KeyW', '¡UNA CAMILLA CAE SOBRE EL PASILLO! ¡SALTA! [W]', 1800);
      if (escapeQte) {
        audio.ding();
        audio.thump();
        await game.say('¡Salté por encima del armazón de metal!', 'Clara', { thought: true });
      } else {
        audio.thump();
        audio.screech();
        game.shakeCam(1.25);
      }

      await game.until(() => game.player.pos.x >= 24.0 * 3 || hospital.floorNum < 4);
      stalker.hide();
      audio.door();
      await game.say('Logré cruzar la puerta cortafuego y trabarla desde las escaleras...', 'Clara', { thought: true });
      await game.say('Hay alguien vivo... o algo inhumano... encerrado en ese piso.', 'Clara', { thought: true });

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

      // Pilas de repuesto para la huida final
      game.place({
        id: 'battery_c5',
        floor: 1,
        x: 3.6,
        y: 1.14,
        z: 7.2,
        range: 2.6,
        label: 'Pilas AA selladas de emergencia',
        model: batteryMesh,
        spin: true,
        async onUse(g) {
          g.giveBattery(1.0);
          g.removeObj('battery_c5');
          await g.say('Pilas nuevas para la linterna.', 'Clara', { thought: true });
        }
      });

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
          await g.examineItem({
            title: 'FOTOGRAFÍA POLAROID (1984)',
            sub: 'Evidencia Forense Nº 84 · Gemelos Valenzuela',
            desc: 'Una fotografía de época de los dos hermanos en la habitación 401. Pulsa [F] para voltearla o rota con el ratón en 360° para leer la macabra inscripción al dorso.',
            model: createDetailedPolaroid
          });
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

          // FLASHBACK CINEMATOGRÁFICO VHS: RECONSTRUCCIÓN DEL CRIMEN EN EL QUIRÓFANO Y EL BISTURÍ
          await g.flashback('scalpel', {
            title: 'REGISTRO FORENSE · RECONSTRUCCIÓN DEL CRIMEN',
            date: 'OCT 14 1984 · 03:45:12 AM',
            location: 'QUIRÓFANO 4 — ASFIXIA MECÁNICA',
          }, 5.5);

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

          // FLASHBACK CINEMATOGRÁFICO FINAL: EL BUCLE TEMPORAL ETERNO
          await g.flashback('timeloop', {
            title: 'REGISTRO DE GUARDIAS · CICLO SIN FIN',
            date: '1984 - 1996 - 2008 - HOY · 23:55 PM',
            location: 'HOSPITAL SAN ANSELMO · RECEPCIÓN',
          }, 6.0);

          // Cinemática final del bucle temporal
          await g.sleep(1.0);
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
