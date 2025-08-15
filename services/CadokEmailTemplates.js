/**
 * SERVICE EMAIL UNIFIÉ - DESIGN KADOC OFFICIEL
 * =============================================
 * 
 * Template unique basé sur EmailTemplates.js
 * Remplace tous les autres templates pour éviter les confusions
 */

class CadokEmailTemplates {

  /**
   * Couleurs officielles KADOC
   */
  static get COLORS() {
    return {
      PRIMARY: '#022601',      // Vert foncé principal
      SECONDARY: '#2E7D32',    // Vert moyen  
      ACCENT: '#FF8F00',       // Orange accent
      SUCCESS: '#28a745',      // Vert succès
      WARNING: '#dc3545',      // Rouge alerte
      BACKGROUND: '#f5f5f5',   // Gris clair fond
      WHITE: '#ffffff',
      DARK: '#333333',
      MUTED: '#666666'
    };
  }

  /**
   * Logo KADOC intégré (SVG Base64)
   */
  static get LOGO_SVG() {
    return 'data:image/svg+xml;base64,PHN2ZyBzdHlsZT0iZGlzcGxheTogYmxvY2s7IGJvcmRlci1yYWRpdXM6IDUwJTsiIHZlcnNpb249IjEuMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCAxMDI0LjAwMDAwMCAxMDI0LjAwMDAwMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCI+IDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAuMDAwMDAwLDEwMjQuMDAwMDAwKSBzY2FsZSgwLjEwMDAwMCwtMC4xMDAwMDApIiBmaWxsPSIjMDAwMDAwIiBzdHJva2U9Im5vbmUiPiA8cGF0aCBkPSJNNzgyMCAxMDE2NSBjLTkgLTEwIC0zMiAtMTUgLTc0IC0xNSAtNDQgMCAtNjkgLTYgLTkxIC0yMCAtMTYgLTExIC00NSAtMjAgLTYzIC0yMCAtMTkgMCAtNDUgLTkgLTU5IC0yMCAtMTQgLTExIC0zNyAtMjAgLTUyIC0yMCAtMTQgMCAtMzUgLTcgLTQ1IC0xNSAtMTEgLTggLTMwIC0xNSAtNDIgLTE1IC0xMiAwIC0zMyAtOSAtNDcgLTIwIC0xNCAtMTEgLTM0IC0yMCAtNDUgLTIwIC0xMCAwIC0yNyAtOSAtMzcgLTIwIC0xMCAtMTEgLTI3IC0yMCAtMzcgLTIwIC0xMSAwIC0zOSAtMTYgLTYyIC0zNSAtMjQgLTE5IC01MCAtMzUgLTU4IC0zNSAtOCAwIC0yMyAtOSAtMzMgLTIwIC0xMCAtMTEgLTI1IC0yMCAtMzQgLTIwIC05IDAgLTMyIC0xNSAtNTEgLTMzIC0xOSAtMTkgLTU2IC00NiAtODEgLTYwIC0yNSAtMTUgLTU1IC0zNyAtNjUgLTQ4IC0xMCAtMTIgLTQ0IC0zNyAtNzQgLTU3IC03MiAtNDcgLTQzMyAtNDAyIC00NzYgLTQ2OSAtMTggLTI5IC02NCAtODUgLTEwMiAtMTI1IC0zOCAtNDAgLTcyIC04MiAtNzYgLTkzIC0zIC0xMSAtMTkgLTM1IC0zNSAtNTIgLTE1IC0xNyAtMzkgLTQ5IC01MSAtNzAgLTEzIC0yMSAtNDEgLTU3IC02MiAtODAgLTIxIC0yNCAtMzggLTQ4IC0zOCAtNTQgMCAtNyAtMTYgLTMxIC0zNSAtNTUgLTE5IC0yMyAtMzUgLTQ1IC0zNSAtNDggMCAtNyAtNDQgLTcxIC02MSAtODkgLTE0IC0xNSAtNTcgLTgyIC05NiAtMTQ5IC0xMSAtMjEgLTM3IC01NyAtNTcgLTgwIC0yMCAtMjMgLTM2IC00NyAtMzYgLTU0IDAgLTcgLTE4IC0zMiAtNDAgLTU2IC0yMiAtMjQgLTQwIC01MCAtNDAgLTU5IDAgLTggLTE0IC0yOCAtMzEgLTQ1IC0xNyAtMTYgLTQzIC01MSAtNTkgLTc5IC0xNiAtMjcgLTQyIC02MyAtNTkgLTc5IC0xNyAtMTYgLTQwIC00OCAtNTIgLTY5IC0xMSAtMjIgLTM2IC01NiAtNTQgLTc2IC0xOSAtMjAgLTQ4IC01NiAtNjQgLTgxIC0xNiAtMjUgLTUwIC02NyAtNzUgLTk1IC0yNSAtMjcgLTQ2IC01NCAtNDYgLTYwIDAgLTcgLTI0IC0zOCAtNTMgLTcxIC0yOSAtMzIgLTU4IC03MCAtNjQgLTg0IC02IC0xNCAtMzggLTU2IC03MiAtOTQgLTMzIC0zNyAtNjMgLTc3IC02NiAtODcgLTQgLTEwIC0yNCAtMzcgLTQ2IC01OCAtMjEgLTIyIC0zOSAtNDYgLTM5IC01NCAwIC03IC0yNCAtNDEgLTU0IC03NCAtMzAgLTMyIC02NCAtNzcgLTc1IC05OSAtMTIgLTIyIC0zNSAtNTMgLTUxIC02OSAtMTYgLTE2IC0zOSAtNDYgLTUwIC02NyAtMjUgLTQ4IC0xODcgLTIwOCAtMjExIC0yMDggLTkgMCAtMjIgLTcgLTI5IC0xNSAtOSAtMTEgLTMyIC0xNSAtODEgLTE1IGwtNjkgMCAwIDEwMCBjMCA2NyA1IDExMyAxNSAxMzcgMTAgMjMgMTUgNjkgMTUgMTM3IDAgODIgNCAxMDggMjAgMTM5IDE1IDI4IDIwIDU2IDIwIDExOSAwIDY2IDQgODkgMjAgMTEzIDE1IDIzIDIwIDQ3IDIwIDEwNSAxIDUwIDYgODEgMTUgOTQgMTAgMTMgMTUgNDQgMTUgOTEgMCA1MSA1IDgwIDIwIDEwOCAxNCAyNiAyMCA1NiAyMCAxMDIgMCA0NiA2IDc2IDIwIDEwMiAxMyAyNSAyMCA1NyAyMCA5NiAwIDMyIDcgNzEgMTUgODcgOCAxNiAxNiA1NyAxOCA5MiAyIDM1IDEyIDc4IDIxIDk1IDEwIDIxIDE2IDU3IDE2IDEwMSAwIDU0IDQgNzUgMjAgOTUgMTYgMjAgMjAgNDAgMjAgOTggMCA1MiA0IDc3IDE2IDkwIDEwIDExIDE4IDQyIDIwIDgxIDMgMzQgMTEgNzIgMTkgODUgOSAxNCAxNSA0NyAxNSA4NSAwIDQ2IDUgNzEgMjAgOTMgMTQgMjEgMjAgNDcgMjAgODggMCAzOCA3IDcwIDIwIDk0IDEzIDI2IDIwIDU3IDIwIDk4IDEgMzcgNiA2NyAxNSA3OSAyMiAyOSAyMiAzNTQgMCAzNjIgLTggNCAtMTUgMTcgLTE1IDMwIDAgMzAgLTE2MCAxOTQgLTE4OSAxOTQgLTEwIDAgLTI0IDcgLTMxIDE1IC03IDggLTIyIDE1IC0zNSAxNSAtMTIgMCAtMzAgOSAtNDAgMjAgLTEzIDE1IC0zMSAyMCAtNjggMjAgLTMzIDAgLTYxIDcgLTg0IDIxIC0zNCAyMSAtMzggMjEgLTQ4NiAxNiAtMjYxIC00IC00NzUgLTExIC01MDcgLTE3IC0zMCAtNiAtMTU4IC0xNSAtMjg1IC0xOSAtMTg3IC02IC0yMzYgLTEwIC0yNjAgLTI0IC0yMSAtMTIgLTU0IC0xNyAtMTEwIC0xNyAtNDYgMCAtODYgLTUgLTkyIC0xMSAtNiAtNiAtMzMgLTE1IC01OSAtMjAgLTI2IC01IC01NSAtMTYgLTY0IC0yNCAtOSAtOCAtMjcgLTE1IC00MCAtMTUgLTI3IDAgLTE5MCAtMTU0IC0xOTAgLTE4MCAwIC0xMCAtOSAtMjkgLTIwIC00MyAtMTggLTIyIC0yMCAtNDAgLTIwIC0xNTIgMCAtMTI2IDAgLTEyNyAzNSAtMTg4IDE5IC0zNCA0MCAtNjkgNDUgLTc3IDYgLTggMjMgLTM1IDM4IC01OSAxNSAtMjQgMzcgLTU2IDQ5IC03MSAxMyAtMTUgMjMgLTMzIDIzIC0zOCAwIC02IDEyIC0yOCAyNiAtNDkgMzUgLTUxIDg0IC0xNTggODQgLTE4MSAwIC0xMSA3IC0yNSAxNSAtMzIgOSAtOCAxNSAtMzAgMTUgLTYwIDAgLTMyIDYgLTU1IDIwIC03MyAxOSAtMjQgMjAgLTQwIDIwIC0zNDkgMCAtMjk4IC0yIC0zMjggLTIwIC0zODEgLTE2IC00NSAtMjAgLTgzIC0yMCAtMTg0IC0xIC05MiAtNSAtMTM1IC0xNSAtMTUzIC0xMCAtMTcgLTE0IC01NyAtMTUgLTEyMCAwIC03NiAtNCAtMTA0IC0yMCAtMTM1IC0xNSAtMzAgLTIwIC01OSAtMjAgLTEyNSAwIC02OCAtNCAtOTEgLTIwIC0xMTUgLTE1IC0yMyAtMjAgLTQ3IC0yMCAtMTA1IDAgLTQ3IC01IC04MyAtMTQgLTk1IC03IC0xMSAtMTUgLTU0IC0xOCAtOTYgLTMgLTQ4IC0xMSAtODUgLTIxIC0xMDAgLTExIC0xNSAtMTcgLTQ0IC0xNyAtODIgMCAtMzggLTcgLTcxIC0yMCAtOTcgLTEzIC0yNiAtMjAgLTU5IC0yMCAtMTAwIDAgLTQwIC02IC03MiAtMTkgLTk2IC0xNSAtMjggLTE4IC00OCAtMTQgLTg5IDUgLTQzIDEgLTYyIC0xNiAtOTUgLTE1IC0zMCAtMjEgLTU5IC0yMSAtMTA4IDAgLTQ5IC01IC03NiAtMjAgLTEwMCAtMTUgLTI0IC0yMCAtNTAgLTIwIC0xMDIgMCAtNTEgLTUgLTgwIC0yMCAtMTA3IC0xNSAtMjggLTIwIC01NyAtMjAgLTExNCAwIC01NiAtNCAtODAgLTE1IC04OSAtMTEgLTkgLTE1IC0zMyAtMTUgLTg2IDAgLTU1IC01IC04NCAtMjAgLTExMSAtMTUgLTI4IC0yMCAtNTcgLTIwIC0xMDkgMCAtNTAgLTYgLTg1IC0yMCAtMTE1IC0xNCAtMzEgLTIwIC02NiAtMjAgLTEyMCAwIC01NiAtNCAtODAgLTE1IC04OSAtMTEgLTkgLTE1IC0zNCAtMTUgLTk0IDAgLTYyIC01IC05MCAtMjAgLTExOSAtMTUgLTI4IC0yMCAtNTYgLTIwIC0xMTkgMCAtNjYgLTQgLTg5IC0yMCAtMTEzIC0xNiAtMjQgLTIwIC00NyAtMjAgLTExNSAtMSAtNTkgLTUgLTkxIC0xNSAtMTA0IC0xMCAtMTMgLTE1IC00NCAtMTUgLTkyIDAgLTU2IC00IC03NyAtMjAgLTk3IC0xNSAtMTggLTIwIC00MCAtMjAgLTgxIDAgLTM4IC02IC02NiAtMjAgLTg4IC0xMyAtMjIgLTIwIC01MSAtMjAgLTg4IDAgLTMyIC03IC02MyAtMTUgLTc0IC05IC0xMiAtMTUgLTQxIC0xNSAtNzEgMCAtMzEgLTggLTY0IC0yMCAtODggLTEzIC0yMyAtMjAgLTU2IC0yMCAtODkgMCAtMzYgLTcgLTYzIC0yMCAtODMgLTEzIC0yMCAtMjAgLTQ3IC0yMCAtODEgMCAtMzQgLTUgLTU2IC0xNSAtNjQgLTkgLTcgLTE1IC0yOSAtMTUgLTU0IDAgLTIzIC05IC01NSAtMjAgLTc0IC0xMSAtMTggLTIwIC01MCAtMjAgLTcxIDAgLTI1IC03IC00NCAtMjAgLTU2IC0xMiAtMTEgLTIwIC0zMSAtMjAgLTQ5IDAgLTE3IC02IC00MCAtMTQgLTUxIC03IC0xMSAtMTcgLTM0IC0yMCAtNTIgLTQgLTE3IC0xNCAtMzcgLTIyIC00NCAtOCAtNiAtMTQgLTE5IC0xNCAtMjkgMCAtOSAtOSAtMjkgLTIwIC00MyAtMTEgLTE0IC0yMCAtMzIgLTIwIC00MCAwIC04IC03IC0yMCAtMTUgLTI3IC04IC03IC0xNSAtMjAgLTE1IC0zMCAwIC05IC05IC0yOSAtMjAgLTQzIC0xMSAtMTQgLTIwIC0zMSAtMjAgLTM5IDAgLTcgLTE1IC0yOSAtMzQgLTQ4IC0xOCAtMTkgLTQ5IC02MCAtNjkgLTkwIC0xOSAtMzAgLTY1IC04NCAtMTAyIC0xMjAgLTM3IC0zNiAtODQgLTkwIC0xMDQgLTEyMCAtMjAgLTMwIC00OSAtNjkgLTY0IC04NiAtMjkgLTMzIC02NyAtMTAwIC02NyAtMTIwIDAgLTYgLTkgLTIzIC0yMCAtMzcgLTE3IC0yMSAtMjAgLTQwIC0yMCAtMTEzIDAgLTg4IDQgLTEwMiA1OCAtMjEyIDIzIC00NSAxMDYgLTEyMiAxMzIgLTEyMiAxMSAwIDIzIC03IDI2IC0xNSA0IC04IDE0IC0xNSAyNCAtMTUgOSAwIDI5IC05IDQzIC0yMCAxNiAtMTMgNDAgLTIwIDY2IC0yMCAyMyAwIDU4IC04IDc5IC0xNyAyNiAtMTIgODAgLTE5IDE4NyAtMjQgODMgLTQgMTczIC0xMiAyMDAgLTE3IDMxIC03IDI2MiAtMTEgNjIwIC0xMSA0NzIgLTEgNTc5IDIgNjI1IDE0IDQxIDExIDExNCAxNSAyODAgMTUgMjA4IDAgMjI3IDIgMjU1IDIwIDE3IDExIDQ3IDIwIDY4IDIwIDI0IDAgNDkgOCA2NCAyMCAxNCAxMSAzMyAyMCA0MyAyMCAxNSAwIDE0NSAxMjQgMTg5IDE4MiAxMiAxNCAyMSA0MSAyMSA1OSAwIDE4IDggNDEgMTggNTIgMTQgMTYgMTcgMzggMTcgMTMxIDAgOTAgLTMgMTE2IC0xNyAxMzYgLTEyIDE2IC0xOCA0MyAtMTggODAgMCAzOCAtNiA2NCAtMjAgODUgLTEyIDE4IC0yMCA0NyAtMjAgNzMgMCAyNCAtOCA1NSAtMTcgNjkgLTEyIDE3IC0xOCA0NyAtMTggODQgMCA0MCAtNSA2MyAtMTggNzYgLTEyIDE0IC0xNyAzNyAtMTcgODEgMCA0MyAtNiA3NCAtMjAgOTkgLTE5IDM2IC0yMCA1NyAtMjAgNTAzIDAgNDQyIDEgNDY3IDIwIDUwOSAxNSAzMiAyMCA2NSAyMCAxMzAgMCA2MCA1IDkzIDE1IDEwOCA4IDExIDE3IDUzIDIwIDkzIDMgNDAgMTIgODIgMjAgOTMgOCAxMiAxNSA0NCAxNSA3MiAwIDMzIDcgNjAgMjAgODAgMTEgMTcgMjAgNDcgMjAgNjggMCAyMCA5IDU0IDIwIDc0IDExIDIxIDIwIDUyIDIwIDY5IDAgMTcgNyAzNyAxNSA0NCA4IDcgMTUgMjQgMTUgMzkgMCAxNCA5IDQxIDIwIDU5IDExIDE4IDIwIDQzIDIwIDU2IDAgMTMgNyAyOSAxNSAzNiA4IDcgMTggMzAgMjEgNTEgOCA1MCAxMTMgMTY5IDE1MCAxNjkgMTYgMCA0OCAtMjUgMTA0IC04MiA0NCAtNDUgODAgLTg3IDgwIC05MyAwIC02IDE1IC0zMyAzNCAtNjAgMTggLTI4IDM2IC02MCA0MCAtNzIgNCAtMTEgMTMgLTI3IDIxIC0zMyA4IC03IDE1IC0yMCAxNSAtMjkgMCAtMTUgMTggLTU4IDYxIC0xNDMgMTEgLTIwIDE5IC00MyAxOSAtNTEgMCAtOCA3IC0yMCAxNSAtMjcgOCAtNyAxNSAtMjkgMTUgLTUwIDAgLTI0IDcgLTQzIDIwIC01NSAxMSAtMTAgMjAgLTI5IDIwIC00MiAwIC0xMyA5IC00MCAyMCAtNjAgMTEgLTIxIDIwIC01MCAyMCAtNjQgMCAtMTUgNyAtMzIgMTUgLTM5IDggLTcgMTUgLTI3IDE1IC00NCAwIC0xNyA5IC00OCAyMCAtNjkgMTEgLTIwIDIwIC00NyAyMCAtNTkgMCAtMTIgNyAtMjkgMTYgLTM5IDkgLTEwIDE5IC00MCAyMSAtNjYgMyAtMjYgMTEgLTU1IDE4IC02MyA3IC04IDE1IC0zNCAxOCAtNTggMyAtMjQgMTIgLTUxIDIxIC02MSA5IC0xMCAxNiAtMjcgMTYgLTM5IDAgLTEyIDkgLTM2IDIwIC01NCAxMSAtMTggMjAgLTQ3IDIwIC02NCAwIC0xNiA1IC0zNSAxMSAtNDEgNiAtNiAxNSAtMzMgMjAgLTU5IDUgLTI2IDE2IC01NSAyNCAtNjQgOCAtOSAxNSAtMzAgMTUgLTQ2IDAgLTE2IDkgLTQyIDIwIC01OSAxMSAtMTYgMjAgLTQxIDIwIC01NCAwIC0xNCA3IC0zMiAxNSAtNDEgOSAtMTAgMTggLTM0IDIwIC01NiAzIC0yMSAxMiAtNDUgMjAgLTU0IDggLTkgMTUgLTMxIDE1IC00OSAwIC0xOCA5IC00NCAyMCAtNTggMTEgLTE0IDIwIC0zNCAyMCAtNDUgMCAtMTAgNiAtMjkgMTQgLTQxIDggLTEyIDE3IC0zOCAyMCAtNTggNCAtMjEgMTMgLTQyIDIxIC00OSA4IC03IDE1IC0yNCAxNSAtMzkgMCAtMTQgOSAtMzkgMjAgLTU2IDExIC0xNiAyMCAtMzggMjAgLTQ4IDAgLTExIDkgLTMwIDIwIC00NCAxMSAtMTQgMjAgLTM0IDIwIC00MyAwIC0xMCA3IC0yMyAxNSAtMzAgOCAtNyAxNSAtMjIgMTUgLTM0IDAgLTExIDkgLTM0IDIwIC01MSAxMSAtMTYgMjAgLTM4IDIwIC00OCAwIC0xMSA5IC0zMCAyMCAtNDQgMTEgLTE0IDIwIC0zNCAyMCAtNDMgMCAtMTAgNyAtMjMgMTUgLTMwIDggLTcgMTUgLTIwIDE1IC0zMCAwIC05IDkgLTI5IDIwIC00MyAxMSAtMTQgMjAgLTM0IDIwIC00NCAwIC0xMCA5IC0yNiAyMCAtMzYgMTEgLTkgMjAgLTI1IDIwIC0zNiAwIC0xMCA3IC0yNCAxNSAtMzEgOCAtNyAxNSAtMjAgMTUgLTMwIDAgLTkgOSAtMjkgMjAgLTQzIDExIC0xNCAyMCAtMzEgMjAgLTM4IDAgLTYgMTYgLTMxIDM1IC01NSAxOSAtMjMgMzUgLTUwIDM1IC01OCAwIC05IDkgLTI0IDIwIC0zMyAxMSAtMTAgMjAgLTI3IDIwIC0zOSAwIC0xMSA4IC0yOCAxOCAtMzcgMTAgLTkgMjkgLTM3IDQxIC02MyAxMyAtMjUgMjkgLTQ4IDM2IC01MSA4IC0yIDE2IC0xNyAyMCAtMzIgMyAtMTUgMjQgLTQ2IDQ2IC03MCAyMyAtMjQgNDcgLTU3IDU0IC03NSA3IC0xNyAyOCAtNDQgNDUgLTYxIDE4IC0xNiA0MyAtNTAgNTggLTc1IDIyIC0zOCAxMzAgLTE1NyAzMTIgLTM0MCAxMDEgLTEwMSAyMjMgLTIxMSAyNTIgLTIyNiAxNyAtOSA0MyAtMjcgNTcgLTQxIDE0IC0xMyA0MCAtMzAgNTYgLTM3IDE3IC04IDQ1IC0yOCA2NCAtNDUgMTkgLTE3IDM4IC0zMSA0MyAtMzEgNCAwIDMxIC0xNiA1OCAtMzUgMjcgLTE5IDU1IC0zNSA2MSAtMzUgNiAwIDIyIC05IDM2IC0yMCAxNCAtMTEgMzQgLTIwIDQzIC0yMCAxMCAwIDIzIC03IDMwIC0xNSA3IC04IDIxIC0xNSAzMiAtMTUgMTEgMCAzMSAtOSA0NSAtMjAgMTQgLTExIDM1IC0yMCA0NyAtMjAgMTEgMCAzNSAtOSA1MSAtMjAgMTcgLTExIDQwIC0yMCA1MSAtMjAgMTIgMCAyNyAtNyAzNCAtMTUgNyAtOCAyOSAtMTUgNTAgLTE1IDI0IDAgNDMgLTcgNTUgLTIwIDE0IC0xNSAzMSAtMjAgNzMgLTIwIDM4IDAgNjEgLTUgNzQgLTE3IDEzIC0xMSA0NCAtMTggOTggLTIyIDQ0IC00IDg1IC0xMiA5MiAtMTkgMTkgLTE5IDcyNCAtMTcgNzU4IDMgMTUgOCA1MyAxNCA5NSAxNSA1MyAwIDc3IDUgMTAwIDIwIDE5IDEyIDQ3IDIwIDc1IDIwIDI1IDAgNTYgNyA2OCAxNiAxMiA4IDQ3IDE4IDc3IDIxIDMwIDMgNjAgMTIgNjYgMTkgNiA4IDI4IDE0IDQ5IDE0IDIyIDAgNDggOCA2MyAyMCAxNCAxMSAzMyAyMCA0MiAyMCA5IDAgMjggOSA0MiAyMCAxNCAxMSAzNiAyMCA0OCAyMCAxMiAwIDI4IDcgMzUgMTUgNyA4IDE4IDE1IDI1IDE1IDcgMCAyNCA5IDM4IDIwIDE0IDExIDMyIDIwIDQwIDIwIDE4IDAgMjA3IDE5NSAyMDcgMjE0IDAgNyA5IDI1IDIwIDM5IDExIDE0IDIwIDMyIDIwIDQwIDAgNyA5IDI0IDIwIDM3IDE3IDIwIDIwIDM3IDIwIDEzMSAwIDkyIC0zIDExMyAtMjIgMTQ2IC0yOSA1MSAtOTggMTIzIC0xMTkgMTIzIC05IDAgLTI4IDkgLTQyIDIwIC0xOCAxNSAtNDAgMjAgLTgyIDIwIC00MiAwIC02NCA1IC04MiAyMCAtMTQgMTEgLTM1IDIwIC00NyAyMCAtMTIgMCAtMzEgNyAtNDIgMTUgLTEwIDggLTI2IDE1IC0zNSAxNSAtOSAwIC0yOCA5IC00MiAyMCAtMTQgMTEgLTM0IDIwIC00NCAyMCAtMTAgMCAtMjYgOSAtMzYgMjAgLTkgMTEgLTI1IDIwIC0zNiAyMCAtMTAgMCAtMjQgNiAtMzAgMTQgLTcgOCAtMjkgMjMgLTQ5IDM0IC0xMDMgNTQgLTEzNyA3MyAtMTQyIDgwIC00IDcgLTI0IDIwIC04MSA1NyAtOCA1IC0zNyAyNCAtNjQgNDAgLTI3IDE3IC02NyA0NiAtODkgNjYgLTIzIDIwIC02NiA1NCAtOTcgNzUgLTEwMCA2OSAtNjExIDU4MSAtNjI0IDYyNSAtNCAxMyAtMzEgNDkgLTYwIDc5IC0yOSAzMCAtNjEgNzEgLTcxIDkwIC0xMSAxOSAtMzIgNTAgLTQ4IDY5IC0xNSAxOSAtMzMgNDcgLTM4IDYzIC01IDE1IC0xNCAyOCAtMTggMjggLTUgMCAtMjIgMjQgLTM5IDU0IC0xNyAyOSAtMzggNTkgLTQ2IDY2IC04IDcgLTE1IDE5IC0xNSAyOCAwIDggLTE2IDM0IC0zNSA1OCAtMTkgMjMgLTM1IDQ5IC0zNSA1NyAwIDcgLTkgMjIgLTIwIDMyIC0xMSAxMCAtMjAgMjMgLTIwIDI5IDAgNiAtMTYgMzUgLTM1IDY1IC0xOSAyOSAtMzUgNTcgLTM1IDYzIDAgNSAtOSAyMSAtMjAgMzUgLTExIDE0IC0yMCAzNCAtMjAgNDUgMCAxMCAtNiAyMSAtMTQgMjQgLTggMyAtMTggMTggLTIxIDM0IC0zIDE2IC0xMyAzNCAtMjEgNDEgLTggNiAtMTQgMjEgLTE0IDM0IDAgMTIgLTkgMzAgLTIwIDQwIC0xMSAxMCAtMjAgMjggLTIwIDM5IDAgMTIgLTkgMjkgLTIwIDM5IC0xMSA5IC0yMCAyNSAtMjAgMzYgMCAxMCAtNyAyNCAtMTUgMzEgLTggNyAtMTUgMjIgLTE1IDM1IDAgMTIgLTkgMzAgLTIwIDQwIC0xMSAxMCAtMjAgMjggLTIwIDQwIDAgMTIgLTkgMzAgLTIwIDQwIC0xMSAxMCAtMjAgMjggLTIwIDM5IDAgMTIgLTcgMzAgLTE1IDQwIC04IDExIC0xNSAzMCAtMTUgNDIgMCAxMiAtOSAzMyAtMjAgNDcgLTExIDE0IC0yMCAzMyAtMjAgNDIgMCA5IC05IDI4IC0yMCA0MiAtMTEgMTQgLTIwIDM0IC0yMCA0MyAwIDEwIC03IDIzIC0xNSAzMCAtOCA3IC0xNSAyMiAtMTUgMzQgMCAxMSAtOSAzNiAtMjAgNTQgLTExIDE4IC0yMCA0MyAtMjAgNTYgMCAxMiAtOSAzMSAtMjAgNDEgLTExIDEwIC0yMCAyOCAtMjAgNDAgMCAxMyAtNiAyOCAtMTQgMzQgLTggNyAtMTcgMzAgLTIxIDUxIC00IDIxIC0xMyA0NCAtMjEgNTEgLTggNiAtMTQgMjQgLTE0IDM5IDAgMTUgLTkgMzUgLTIwIDQ1IC0xMSAxMCAtMjAgMjggLTIwIDQwIDAgMTMgLTcgMjggLTE1IDM1IC04IDcgLTE1IDIwIC0xNSAyOSAwIDkgLTkgMzQgLTIwIDU2IC0xMSAyMiAtMjAgNDQgLTIwIDUxIDAgNiAtOSAyMyAtMjAgMzcgLTExIDE0IC0yMCAzNCAtMjAgNDUgMCAxMSAtNyAyNSAtMTUgMzIgLTggNyAtMTcgMjcgLTIxIDQ2IC0zIDE4IC0xMiAzOCAtMjAgNDUgLTggNiAtMTQgMjEgLTE0IDMzIDAgMTEgLTkgMzUgLTIwIDUxIC0xMSAxNyAtMjAgMzYgLTIwIDQzIDAgOCAtOSAyNSAtMjAgMzkgLTExIDE0IC0yMCAzNiAtMjAgNDggMCAxMyAtNyAyNSAtMTUgMjkgLTggMyAtMTUgMTYgLTE1IDI5IDAgMTMgLTkgMzIgLTIwIDQyIC0xMSAxMCAtMjAgMjcgLTIwIDM3IDAgMTEgLTkgMzEgLTIwIDQ1IC0xMSAxNCAtMjAgMzQgLTIwIDQ1IDAgMTAgLTcgMjEgLTE1IDI0IC04IDQgLTE1IDE3IC0xNSAzMCAwIDEzIC05IDMyIC0yMCA0MSAtMTEgMTAgLTIwIDI3IC0yMCAzOSAwIDExIC05IDI5IC0yMCAzOSAtMTEgMTAgLTIwIDI0IC0yMCAzMiAwIDcgLTE2IDM2IC0zNSA2MyAtMTkgMjcgLTM1IDU2IC0zNSA2NSAwIDggLTkgMTkgLTIwIDI1IC0xMSA2IC0yMCAyMCAtMjAgMzAgMCAxMSAtMTUgMzcgLTMzIDU3IC0xOCAyMSAtMzggNTAgLTQ0IDY0IC02IDE1IC0yNSA0MiAtNDEgNjAgLTE2IDE5IC00NiA1OSAtNjcgODkgLTIxIDMwIC02MSA3OCAtODkgMTA2IC04NyA4NiAtMTkzIDIwOCAtMjAwIDIyOSAtNyAyNCA3OSAxNjIgMTQzIDIzMCAyMSAyMiA3MiA4MyAxMTMgMTM1IDgxIDEwMyA0MTYgNDM2IDQ3NyA0NzQgMjEgMTMgODcgNzEgMTQ3IDEyOSA2MCA1NyAxMjggMTE2IDE1MCAxMzAgMjMgMTQgNjYgNDkgOTUgNzcgMzAgMjkgNzQgNjYgOTkgODMgMjUgMTcgNjggNTEgOTUgNzUgMjggMjUgNjQgNTEgODAgNTggMTcgNyA0MyAyNiA1OSA0MyAxNyAxNyAzNSAzMSA0MiAzMSA3IDAgMzUgMTggNjMgNDAgMjggMjIgNTYgNDAgNjIgNDAgNiAwIDI4IDEzIDQ4IDI4IDIwIDE2IDY2IDQzIDEwMyA2MSAzNyAxOCA3MCAzNiA3MyA0MCAyIDUgMjIgMTEgNDMgMTUgMjIgMyA0NSAxMyA1MiAyMSA3IDggMjQgMTUgMzkgMTUgMTQgMCA0MCA5IDU2IDIwIDE3IDExIDQ3IDIwIDY5IDIwIDIzIDAgNDcgNyA1OCAxNyAxNiAxNSA2MiAxNiQ3NyAxNDQ0NSAtMSA0NTkgLTEgNDg0IDE5IDE0IDExIDM2IDIwIDQ5IDIwIDEzIDAgNDcgMTUgNzUgMzQgMjkgMTkgNjEgMzcgNzIgNDEgMjggOSAxNzEgMTYzIDE3MSAxODUgMCA5IDcgMjMgMTUgMzAgMjIgMTggNjUgOTYgNjUgMTE4IDAgMTEgNyAyNSAxNSAzMiA4IDcgMTUgMjQgMTUgMzkgMCAxNCA5IDQxIDIwIDU5IDEzIDIxIDIwIDUwIDIwIDg1IDAgMzUgNyA2MiAyMCA4MiAxOCAyOCAyMCA0NyAyMCAyNDUgMCAxOTYgLTIgMjE5IC0yMCAyNTMgLTEyIDIyIC0yMCA1NiAtMjAgODQgMCAzMSAtNyA1OSAtMjAgNzggLTExIDE3IC0yMCA0NCAtMjAgNjEgMCAxNyAtNyAzNyAtMTUgNDQgLTggNyAtMTUgMjIgLTE1IDM1IDAgMTIgLTkgMzAgLTIwIDQwIC0xMSAxMCAtMjAgMjggLTIwIDM5IDAgMTIgLTkgMjkgLTIwIDM5IC0xMSA5IC0yMCAyMyAtMjAgMzAgMCAzNiAtMjg2IDMyNCAtMzMyIDMzMyAtMTUgNCAtMjkgMTIgLTMyIDIwIC0zIDggLTE0IDE0IC0yNCAxNCAtMTEgMCAtMzEgOSAtNDUgMjAgLTE0IDExIC0zMyAyMCAtNDQgMjAgLTEwIDAgLTMxIDkgLTQ4IDIwIC0xNyAxMiAtNDcgMjAgLTcxIDIwIC0yMiAwIC00OSA3IC02MCAxNSAtMjkgMjIgLTQ1NiAyMiAtNDc0IDB6Ii8+IDwvZz4gPC9zdmc+';
  }

  /**
   * Template de base KADOC
   */
  static getBaseTemplate(content, options = {}) {
    const {
      title = 'Email KADOC',
      headerTitle = 'KADOC',
      headerSubtitle = 'Votre marketplace de troc local',
      headerIcon = '🎯'
    } = options;

    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${this.COLORS.BACKGROUND};">
    
    <div style="max-width: 600px; margin: 0 auto; background: ${this.COLORS.WHITE};">
        <!-- Header avec logo -->
        <div style="background: linear-gradient(135deg, ${this.COLORS.PRIMARY} 0%, ${this.COLORS.SECONDARY} 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <div style="background: ${this.COLORS.WHITE}; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                <img src="${this.LOGO_SVG}" alt="KADOC Logo" style="width: 60px; height: 60px;">
            </div>
            <h1 style="color: ${this.COLORS.WHITE}; margin: 0; font-size: 28px; font-weight: 600;">
                ${headerIcon} ${headerTitle}
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">
                ${headerSubtitle}
            </p>
        </div>

        <!-- Contenu principal -->
        <div style="background: ${this.COLORS.WHITE}; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            ${content}
        </div>

        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #dee2e6; font-size: 12px; color: ${this.COLORS.MUTED};">
            © 2025 KADOC - Votre marketplace de troc local<br>
            Cet email a été généré automatiquement.
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Template Email de Vérification
   */
  static getVerificationTemplate(userName, verificationCode, verificationUrl, userEmail) {
    const content = `
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: ${this.COLORS.DARK}; margin: 0 0 15px; font-size: 24px;">
                    🎉 Votre compte a été créé !
                </h2>
                <p style="color: ${this.COLORS.MUTED}; margin: 0; font-size: 16px; line-height: 1.6;">
                    Salut <strong style="color: ${this.COLORS.PRIMARY};">${userName}</strong> ! <br>
                    Bienvenue dans la communauté KADOC. Pour commencer à échanger, 
                    il nous faut juste vérifier votre adresse email.
                </p>
            </div>

            <!-- Code de vérification stylé -->
            <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 2px dashed ${this.COLORS.SECONDARY}; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                <p style="color: ${this.COLORS.MUTED}; margin: 0 0 15px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                    Votre code de vérification
                </p>
                <div style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; color: ${this.COLORS.ACCENT}; background: ${this.COLORS.WHITE}; padding: 15px; border-radius: 8px; border: 2px solid ${this.COLORS.ACCENT}; display: inline-block; letter-spacing: 4px;">
                    ${verificationCode}
                </div>
                <p style="color: ${this.COLORS.MUTED}; margin: 15px 0 0; font-size: 12px;">
                    Ce code expire dans 15 minutes
                </p>
            </div>

            <!-- Bouton CTA -->
            <div style="text-align: center; margin: 35px 0;">
                <a href="${verificationUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, ${this.COLORS.SECONDARY} 0%, ${this.COLORS.SUCCESS} 100%); 
                          color: ${this.COLORS.WHITE}; padding: 16px 32px; text-decoration: none; border-radius: 30px; 
                          font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(46,125,50,0.3);">
                    ✅ Vérifier mon compte
                </a>
            </div>

            <!-- Info complémentaire -->
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: ${this.COLORS.PRIMARY}; margin: 0 0 15px; font-size: 18px;">🚀 Que pouvez-vous faire ensuite ?</h3>
                <ul style="color: ${this.COLORS.MUTED}; margin: 0; padding-left: 20px; line-height: 1.6;">
                    <li>Publier vos premiers objets à échanger</li>
                    <li>Découvrir les annonces de votre quartier</li>
                    <li>Commencer vos premiers trocs</li>
                </ul>
            </div>
    `;

    return this.getBaseTemplate(content, {
      title: 'Vérifiez votre compte KADOC',
      headerTitle: 'KADOC',
      headerSubtitle: 'Vérification de compte',
      headerIcon: '🔐'
    });
  }

  /**
   * Template Email de Bienvenue
   */
  static getWelcomeTemplate(userName, loginUrl = '#') {
    const content = `
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: ${this.COLORS.SUCCESS}; margin: 0 0 15px; font-size: 28px;">
                    🎉 Compte vérifié avec succès !
                </h2>
                <p style="color: ${this.COLORS.MUTED}; margin: 0; font-size: 18px; line-height: 1.6;">
                    Félicitations <strong style="color: ${this.COLORS.PRIMARY};">${userName}</strong> !<br>
                    Votre compte KADOC est maintenant actif.
                </p>
            </div>

            <!-- Avantages -->
            <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="color: ${this.COLORS.PRIMARY}; margin: 0 0 20px; font-size: 20px;">✨ Prêt à commencer l'aventure ?</h3>
                <div style="display: grid; gap: 15px;">
                    <div style="background: ${this.COLORS.WHITE}; padding: 15px; border-radius: 8px; border-left: 4px solid ${this.COLORS.ACCENT};">
                        <strong style="color: ${this.COLORS.PRIMARY};">🔄 Échanger</strong><br>
                        <span style="color: ${this.COLORS.MUTED};">Troquez vos objets avec vos voisins</span>
                    </div>
                    <div style="background: ${this.COLORS.WHITE}; padding: 15px; border-radius: 8px; border-left: 4px solid ${this.COLORS.ACCENT};">
                        <strong style="color: ${this.COLORS.PRIMARY};">📱 Publier</strong><br>
                        <span style="color: ${this.COLORS.MUTED};">Ajoutez vos annonces facilement</span>
                    </div>
                    <div style="background: ${this.COLORS.WHITE}; padding: 15px; border-radius: 8px; border-left: 4px solid ${this.COLORS.ACCENT};">
                        <strong style="color: ${this.COLORS.PRIMARY};">🌍 Découvrir</strong><br>
                        <span style="color: ${this.COLORS.MUTED};">Explorez votre communauté locale</span>
                    </div>
                </div>
            </div>

            <!-- CTA Principal -->
            <div style="text-align: center; margin: 35px 0;">
                <a href="${loginUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, ${this.COLORS.ACCENT} 0%, #F57C00 100%); 
                          color: ${this.COLORS.WHITE}; padding: 18px 36px; text-decoration: none; border-radius: 30px; 
                          font-weight: 600; font-size: 18px; box-shadow: 0 4px 15px rgba(255,143,0,0.3);">
                    🚀 Commencer à troquer
                </a>
            </div>
    `;

    return this.getBaseTemplate(content, {
      title: 'Bienvenue sur KADOC !',
      headerTitle: 'KADOC',
      headerSubtitle: 'Bienvenue dans la communauté !',
      headerIcon: '🎉'
    });
  }

  /**
   * Template Reset Password
   */
  static getPasswordResetTemplate(userName, resetUrl) {
    const content = `
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: ${this.COLORS.WARNING}; margin: 0 0 15px; font-size: 24px;">
                    🔐 Réinitialisation de mot de passe
                </h2>
                <p style="color: ${this.COLORS.MUTED}; margin: 0; font-size: 16px; line-height: 1.6;">
                    Bonjour <strong style="color: ${this.COLORS.PRIMARY};">${userName}</strong>,<br>
                    Nous avons reçu une demande de réinitialisation de votre mot de passe KADOC.
                </p>
            </div>

            <!-- Alerte sécurité -->
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 24px; margin-right: 10px;">⚠️</span>
                    <strong style="color: #856404;">Sécurité importante</strong>
                </div>
                <p style="color: #856404; margin: 0; font-size: 14px;">
                    Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. 
                    Votre mot de passe reste inchangé.
                </p>
            </div>

            <!-- CTA Reset -->
            <div style="text-align: center; margin: 35px 0;">
                <a href="${resetUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, ${this.COLORS.WARNING} 0%, #c82333 100%); 
                          color: ${this.COLORS.WHITE}; padding: 16px 32px; text-decoration: none; border-radius: 30px; 
                          font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(220,53,69,0.3);">
                    🔒 Réinitialiser mon mot de passe
                </a>
            </div>

            <!-- Info expiration -->
            <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; text-align: center;">
                <p style="color: ${this.COLORS.MUTED}; margin: 0; font-size: 14px;">
                    ⏱️ Ce lien expire dans <strong>1 heure</strong> pour votre sécurité.
                </p>
            </div>
    `;

    return this.getBaseTemplate(content, {
      title: 'Réinitialisation mot de passe KADOC',
      headerTitle: 'KADOC',
      headerSubtitle: 'Sécurité du compte',
      headerIcon: '🔐'
    });
  }

  /**
   * Template Simple/Notification
   */
  static getSimpleTemplate(userName, message, buttonText = null, buttonUrl = null) {
    let buttonHtml = '';
    if (buttonText && buttonUrl) {
      buttonHtml = `
            <div style="text-align: center; margin: 35px 0;">
                <a href="${buttonUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, ${this.COLORS.PRIMARY} 0%, ${this.COLORS.SECONDARY} 100%); 
                          color: ${this.COLORS.WHITE}; padding: 16px 32px; text-decoration: none; border-radius: 30px; 
                          font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(2,38,1,0.3);">
                    ${buttonText}
                </a>
            </div>
      `;
    }

    const content = `
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: ${this.COLORS.PRIMARY}; margin: 0 0 15px; font-size: 24px;">
                    Bonjour ${userName} 👋
                </h2>
            </div>

            <div style="background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <p style="color: ${this.COLORS.DARK}; margin: 0; font-size: 16px; line-height: 1.6; text-align: center;">
                    ${message}
                </p>
            </div>

            ${buttonHtml}
    `;

    return this.getBaseTemplate(content, {
      title: 'Notification KADOC',
      headerTitle: 'KADOC',
      headerSubtitle: 'Notification',
      headerIcon: '📬'
    });
  }
}

module.exports = CadokEmailTemplates;
